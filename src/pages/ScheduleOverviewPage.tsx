import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { signInAnonymous } from '../firebase/auth';
import { getHouse, House } from '../firebase/houses';
import { 
  getWeeksForMonth, 
  formatWeekRange, 
  getRotationWeek,
  getRotationIndexForWeek,
  timestampToDate,
  startOfWeekMonday 
} from '../utils/weekUtils';
import { getCommonAssignmentsForWeek, getSoleResponsibilityAssignmentForWeek } from '../utils/taskAssignment';
import Footer from '../components/Footer';
import ThemeToggle from '../components/ThemeToggle';
import './ScheduleOverviewPage.css';

export default function ScheduleOverviewPage() {
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
      <div className="schedule-overview-page">
        <div className="loading-container">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  const cycleLength = house.cycleLength ?? house.memberCount ?? house.members?.length ?? 4;
  // Normalize schedule start to Monday 00:00:00 LOCAL time
  const scheduleStart = house.scheduleStartDate 
    ? timestampToDate(house.scheduleStartDate) || startOfWeekMonday(new Date())
    : startOfWeekMonday(new Date());
  const scheduleStartMonday = startOfWeekMonday(scheduleStart);

  const allWeeks = getWeeksForMonth(currentYear, currentMonth);
  // Filter weeks to only show from house creation date onwards
  // Normalize each week Monday to ensure proper comparison
  const weeks = allWeeks.filter(weekMonday => {
    const normalizedWeekMonday = startOfWeekMonday(weekMonday);
    return normalizedWeekMonday >= scheduleStartMonday;
  });
  const monthName = new Date(currentYear, currentMonth, 1).toLocaleString('default', { month: 'long', year: 'numeric' });

  // Get sole responsibility assignments for a specific week (rotating through responsible members)
  const getSoleResponsibilityAssignmentsForWeek = (targetWeekMonday: Date): Record<string, string | 'Unassigned'> => {
    const soleAssignments: Record<string, string | 'Unassigned'> = {};
    // Normalize target week Monday to 00:00:00 LOCAL time
    const normalizedTargetMonday = startOfWeekMonday(targetWeekMonday);
    
    if (house.soleResponsibilityAssignments) {
      Object.keys(house.soleResponsibilityAssignments).forEach(task => {
        const taskAssignments = house.soleResponsibilityAssignments![task] || [];
        const assignedMember = getSoleResponsibilityAssignmentForWeek(
          taskAssignments as Array<{ member: string; rotationIndex?: number; week?: number }>,
          scheduleStartMonday,
          normalizedTargetMonday
        );
        soleAssignments[task] = assignedMember;
      });
    }
    
    return soleAssignments;
  };

  // Get assignments for a given week's Monday
  // IMPORTANT: Use the target week's Monday, NOT today's date
  const getAssignmentsForWeek = (targetWeekMonday: Date) => {
    // Normalize target week Monday to 00:00:00 LOCAL time
    const normalizedTargetMonday = startOfWeekMonday(targetWeekMonday);
    
    // Calculate rotation index for THIS specific week (not today)
    const { rotationIndex } = getRotationWeek(scheduleStartMonday, normalizedTargetMonday, cycleLength);
    
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
    const soleAssignments = getSoleResponsibilityAssignmentsForWeek(normalizedTargetMonday);
    Object.keys(soleAssignments).forEach(task => {
      assignments[task] = soleAssignments[task];
    });
    
    return assignments;
  };

  // Get all unique tasks across all weeks to build column headers
  const allTasks = new Set<string>();
  weeks.forEach(weekMonday => {
    const assignments = getAssignmentsForWeek(weekMonday);
    Object.keys(assignments).forEach(task => allTasks.add(task));
  });
  const taskColumns = Array.from(allTasks).sort();

  return (
    <div className="schedule-overview-page">
      <div className="schedule-overview-container">
        <div className="schedule-overview-header">
          <div className="schedule-overview-header-top">
            <button onClick={() => navigate(`/house/${houseCode}`)} className="back-button">
              ← Back to House
            </button>
            <ThemeToggle />
          </div>
          <h1>Schedule Overview</h1>
          <p className="house-name">{house.name}</p>
        </div>

        <div className="month-selector">
          <button onClick={handlePrevMonth} className="month-nav-button">←</button>
          <div className="month-display">
            <h2>{monthName}</h2>
            <button onClick={handleToday} className="today-button">Current Week</button>
          </div>
          <button onClick={handleNextMonth} className="month-nav-button">→</button>
        </div>

        <div className="schedule-table-card">
          <h2 className="schedule-table-title">Schedule Overview</h2>
          
          <div className="schedule-table-wrapper">
            <table className="schedule-table">
              <thead>
                <tr>
                  <th className="col-week-range">Week Range</th>
                  {taskColumns.map((task) => (
                    <th key={task} className="col-task-assignment">{task}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {weeks.map((weekMonday, idx) => {
                  // Normalize week Monday to ensure consistent calculation
                  const normalizedWeekMonday = startOfWeekMonday(weekMonday);
                  const { fromLabel, toLabel } = formatWeekRange(normalizedWeekMonday);
                  const assignments = getAssignmentsForWeek(normalizedWeekMonday);
                  
                  // Calculate rotation index using calendar-safe method
                  const debugRotationIndex = getRotationIndexForWeek(scheduleStartMonday, normalizedWeekMonday, cycleLength);
                  
                  return (
                    <tr key={idx}>
                      <td className="col-week-range">
                        <div className="week-range">
                          <div className="week-range-dates">{fromLabel} – {toLabel}</div>
                          <div className="rotation-debug">(Rotation: {debugRotationIndex})</div>
                        </div>
                      </td>
                      {taskColumns.map((task) => {
                        const member = assignments[task];
                        return (
                          <td key={task} className="col-task-assignment">
                            {member === 'Unassigned' ? (
                              <span className="member-name unassigned-badge">Unassigned</span>
                            ) : member ? (
                              <span className="member-name">{member}</span>
                            ) : (
                              <span className="no-assignment">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

