import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { signInAnonymous } from '../firebase/auth';
import { getHouse, House } from '../firebase/houses';
import { 
  getWeeksForMonth, 
  formatWeekRange, 
  getRotationWeek, 
  timestampToDate,
  startOfWeekMonday 
} from '../utils/weekUtils';
import { getCommonAssignmentsForWeek, getSoleResponsibilityAssignmentForWeek } from '../utils/taskAssignment';
import './AdminPage.css';

export default function AdminPage() {
  const { houseCode } = useParams<{ houseCode: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [house, setHouse] = useState<House | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (!houseCode) {
      navigate('/');
      return;
    }

    const initialize = async () => {
      try {
        await signInAnonymous();
        const houseData = await getHouse(houseCode);
        if (!houseData) {
          alert('House not found. Redirecting...');
          navigate(`/house/${houseCode}`);
          return;
        }
        setHouse(houseData);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading admin page:', error);
        alert('Failed to load admin page. Please try again.');
        navigate(`/house/${houseCode}`);
      }
    };

    initialize();
  }, [houseCode, navigate]);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentMonth(now.getMonth());
    setCurrentYear(now.getFullYear());
  };

  if (isLoading || !house) {
    return (
      <div className="admin-page">
        <div className="loading-container">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  const cycleLength = house.cycleLength ?? house.memberCount ?? house.members?.length ?? 4;
  const scheduleStart = house.scheduleStartDate 
    ? timestampToDate(house.scheduleStartDate) || startOfWeekMonday(new Date())
    : startOfWeekMonday(new Date());

  const allWeeks = getWeeksForMonth(currentYear, currentMonth);
  // Filter weeks to only show from house creation date onwards
  const weeks = allWeeks.filter(weekMonday => {
    const scheduleStartMonday = startOfWeekMonday(scheduleStart);
    return weekMonday >= scheduleStartMonday;
  });
  const monthName = new Date(currentYear, currentMonth, 1).toLocaleString('default', { month: 'long', year: 'numeric' });

  // Get sole responsibility assignments for a specific week (rotating through responsible members)
  const getSoleResponsibilityAssignmentsForWeek = (weekMonday: Date): Record<string, string | 'Unassigned'> => {
    const soleAssignments: Record<string, string | 'Unassigned'> = {};
    const scheduleStartMonday = startOfWeekMonday(scheduleStart);
    
    if (house.soleResponsibilityAssignments) {
      Object.keys(house.soleResponsibilityAssignments).forEach(task => {
        const taskAssignments = house.soleResponsibilityAssignments![task] || [];
        const assignedMember = getSoleResponsibilityAssignmentForWeek(
          taskAssignments as Array<{ member: string; rotationIndex?: number; week?: number }>,
          scheduleStartMonday,
          weekMonday
        );
        soleAssignments[task] = assignedMember;
      });
    }
    
    return soleAssignments;
  };

  // Get assignments for a given week's Monday
  const getAssignmentsForWeek = (weekMonday: Date) => {
    const { rotationIndex } = getRotationWeek(scheduleStart, weekMonday, cycleLength);
    
    const assignments: Record<string, string | 'Unassigned'> = {};
    
    // NEW APPROACH: Process common chore bundles (one bundle per member per week)
    if (house.commonChoreBundles && house.commonChoreBundles.length > 0 && house.members && house.members.length > 0) {
      const bundleAssignments = getCommonAssignmentsForWeek(house.commonChoreBundles, house.members, rotationIndex);
      
      bundleAssignments.forEach(assignment => {
        const bundle = house.commonChoreBundles!.find(b => b.id === assignment.bundleId);
        if (bundle) {
          assignments[bundle.title] = assignment.memberName;
        }
      });
    } else if (house.commonAreaAssignments) {
      // LEGACY APPROACH: Process individual common area tasks
      // TODO: Migrate old houses to use bundles
      Object.keys(house.commonAreaAssignments).forEach(task => {
        const taskAssignments = house.commonAreaAssignments![task] || [];
        const assignment = taskAssignments.find((a: any) => {
          if ('rotationIndex' in a) {
            return a.rotationIndex === rotationIndex;
          } else {
            // Legacy: map week 1-5 to rotation index
            return (a.week - 1) % cycleLength === rotationIndex;
          }
        });
        if (assignment) {
          assignments[task] = assignment.member;
        }
      });
    }
    
    // Add rotating sole responsibility assignments (one person per week, rotating through responsible members)
    const soleAssignments = getSoleResponsibilityAssignmentsForWeek(weekMonday);
    Object.keys(soleAssignments).forEach(task => {
      assignments[task] = soleAssignments[task];
    });
    
    return assignments;
  };

  return (
    <div className="admin-page">
      <div className="admin-container">
        <div className="admin-header">
          <button onClick={() => navigate(`/house/${houseCode}`)} className="back-button">
            ← Back to House
          </button>
          <h1>Schedule Overview</h1>
          <p className="house-name">{house.name}</p>
        </div>

        <div className="month-selector">
          <button onClick={handlePrevMonth} className="month-nav-button">←</button>
          <div className="month-display">
            <h2>{monthName}</h2>
            <button onClick={handleToday} className="today-button">Today</button>
          </div>
          <button onClick={handleNextMonth} className="month-nav-button">→</button>
        </div>

        <div className="weeks-table">
          <div className="weeks-header">
            <div className="week-col-header">Week Range</div>
            <div className="week-col-header">Assignments</div>
          </div>
          
          {weeks.map((weekMonday, idx) => {
            const { fromLabel, toLabel } = formatWeekRange(weekMonday);
            const assignments = getAssignmentsForWeek(weekMonday);
            const assignmentEntries = Object.entries(assignments);
            
            return (
              <div key={idx} className="week-row">
                <div className="week-col">
                  <div className="week-range">
                    {fromLabel} – {toLabel}
                  </div>
                </div>
                <div className="week-col assignments-col">
                  {assignmentEntries.length > 0 ? (
                    <div className="assignments-list">
                      {assignmentEntries.map(([task, member], taskIdx) => (
                        <div key={taskIdx} className="assignment-item">
                          <span className="task-name">{task}:</span>
                          {member === 'Unassigned' ? (
                            <span className="member-name unassigned-badge">Unassigned</span>
                          ) : (
                            <span className="member-name">{member}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="no-assignments">No assignments</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

