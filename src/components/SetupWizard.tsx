import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createHouseWithUniqueCode, getHouse, CommonChoreBundle } from '../firebase/houses';
import { initializeChoresWithSchedule } from '../firebase/chores';
import { waitForAuth, signInAnonymous } from '../firebase/auth';
import { processAndAssignTasks, buildCommonBundles } from '../utils/taskAssignment';
import { buildHouseShareLink, copyToClipboard } from '../utils/shareLink';
import { getSiteSettings } from '../firebase/siteSettings';
import MaintenanceBanner from './MaintenanceBanner';
import SegmentedNav from './ui/SegmentedNav';
import './SetupWizard.css';

export default function SetupWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [houseName, setHouseName] = useState('');
  const [memberCount, setMemberCount] = useState<number | ''>('');
  const [members, setMembers] = useState<string[]>([]);
  const [tasks, setTasks] = useState<string[]>([]);
  const [taskInput, setTaskInput] = useState('');
  const [soleResponsibilityTasks, setSoleResponsibilityTasks] = useState<string[]>([]);
  const [soleResponsibilityInput, setSoleResponsibilityInput] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [groupedTasks, setGroupedTasks] = useState<string[]>([]);
  const [commonAreaAssignments, setCommonAreaAssignments] = useState<Record<string, { member: string; rotationIndex: number }[]>>({}); // Legacy, kept for backward compatibility
  const [commonChoreBundles, setCommonChoreBundles] = useState<CommonChoreBundle[]>([]); // New: bundles
  const [soleResponsibilityMemberSelections, setSoleResponsibilityMemberSelections] = useState<Record<string, string[]>>({});
  const [soleResponsibilityWeeklyAssignments, setSoleResponsibilityWeeklyAssignments] = useState<Record<string, { member: string; rotationIndex: number }[]>>({});
  const [createdHouseCode, setCreatedHouseCode] = useState<string | null>(null);
  const [creatorName, setCreatorName] = useState<string>('');
  const [isNamePromptVisible, setIsNamePromptVisible] = useState(true);
  const [siteSettings, setSiteSettings] = useState<any>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await getSiteSettings();
        setSiteSettings(settings);
      } catch (error) {
        console.error('Error loading site settings:', error);
      } finally {
        setSettingsLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleStep1Next = () => {
    if (houseName.trim()) {
      setStep(2);
    } else {
      alert('Please enter a house name');
    }
  };

  const handleStep2Next = () => {
    const count = typeof memberCount === 'number' ? memberCount : parseInt(String(memberCount)) || 0;
    if (count >= 1 && count < 12) {
      // Initialize member names as empty strings (will be filled in step 4)
      const memberNames: string[] = [];
      for (let i = 1; i <= count; i++) {
        memberNames.push('');
      }
      setMembers(memberNames);
      setStep(3);
    } else {
      alert('Please enter a valid number of members (1-11)');
    }
  };

  const handleMemberCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      setMemberCount('');
    } else {
      const num = parseInt(value);
      if (!isNaN(num) && num >= 0 && num < 12) {
        setMemberCount(num);
      }
    }
  };

  const handleAddTask = () => {
    if (taskInput.trim() && !tasks.includes(taskInput.trim())) {
      setTasks([...tasks, taskInput.trim()]);
      setTaskInput('');
    }
  };

  const handleRemoveTask = (index: number) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };

  const handleAddSoleResponsibility = () => {
    if (soleResponsibilityInput.trim() && !soleResponsibilityTasks.includes(soleResponsibilityInput.trim())) {
      setSoleResponsibilityTasks([...soleResponsibilityTasks, soleResponsibilityInput.trim()]);
      setSoleResponsibilityInput('');
    }
  };

  const handleRemoveSoleResponsibility = (index: number) => {
    setSoleResponsibilityTasks(soleResponsibilityTasks.filter((_, i) => i !== index));
  };

  const handleStep3Next = () => {
    if (tasks.length === 0 && soleResponsibilityTasks.length === 0) {
      alert('Please add at least one task (common area or sole responsibility)');
      return;
    }

    // Process and group common area tasks (for location-based grouping)
    const { groupedTasks: grouped } = processAndAssignTasks(tasks, members);
    setGroupedTasks(grouped);
    
    // Build common chore bundles (ensures one bundle per member per week)
    const memberCount = members.length || 4;
    const bundles = buildCommonBundles(grouped, memberCount);
    setCommonChoreBundles(bundles);
    
    // Keep legacy assignments empty (bundles replace individual task assignments)
    setCommonAreaAssignments({});
    
    // Initialize sole responsibility member selections (empty initially)
    const initialSoleSelections: Record<string, string[]> = {};
    soleResponsibilityTasks.forEach(task => {
      initialSoleSelections[task] = [];
    });
    setSoleResponsibilityMemberSelections(initialSoleSelections);
    
    setStep(4);
  };

  const handleUpdateMemberName = (index: number, name: string) => {
    const updated = [...members];
    const oldName = members[index];
    updated[index] = name;
    setMembers(updated);
    
    // Update assignments if we're on step 4
    if (step === 4) {
      // Update common area assignments
      const updatedCommonAssignments: Record<string, { member: string; rotationIndex: number }[]> = {};
      Object.keys(commonAreaAssignments).forEach(task => {
        updatedCommonAssignments[task] = commonAreaAssignments[task].map(assignment => ({
          ...assignment,
          member: assignment.member === oldName ? name : assignment.member
        }));
      });
      setCommonAreaAssignments(updatedCommonAssignments);
      
      // Update sole responsibility member selections
      const updatedSoleSelections: Record<string, string[]> = {};
      Object.keys(soleResponsibilityMemberSelections).forEach(task => {
        updatedSoleSelections[task] = soleResponsibilityMemberSelections[task].map(m => 
          m === oldName ? name : m
        );
      });
      setSoleResponsibilityMemberSelections(updatedSoleSelections);
      
      // Recalculate weekly assignments for sole responsibilities
      recalculateSoleResponsibilityAssignments(updatedSoleSelections);
    }
  };

  const handleToggleSoleResponsibilityMember = (task: string, member: string) => {
    const current = soleResponsibilityMemberSelections[task] || [];
    const updated = current.includes(member)
      ? current.filter(m => m !== member)
      : [...current, member];
    
    const updatedSelections = {
      ...soleResponsibilityMemberSelections,
      [task]: updated
    };
    setSoleResponsibilityMemberSelections(updatedSelections);
    
    // Recalculate weekly assignments
    recalculateSoleResponsibilityAssignments(updatedSelections);
  };

  const recalculateSoleResponsibilityAssignments = (selections: Record<string, string[]>) => {
    const weeklyAssignments: Record<string, { member: string; rotationIndex: number }[]> = {};
    
    soleResponsibilityTasks.forEach((task, taskIndex) => {
      const selectedMembers = selections[task] || [];
      if (selectedMembers.length > 0) {
        weeklyAssignments[task] = [];
        const cycleLength = selectedMembers.length;
        // Divide tasks among selected members equally using rotation indices
        for (let rotationIndex = 0; rotationIndex < cycleLength; rotationIndex++) {
          const memberIndex = (taskIndex + rotationIndex) % selectedMembers.length;
          weeklyAssignments[task].push({ member: selectedMembers[memberIndex], rotationIndex });
        }
      }
    });
    
    setSoleResponsibilityWeeklyAssignments(weeklyAssignments);
  };

  const handleCreateHouse = async () => {
    // Check if house creation is allowed
    if (siteSettings && !siteSettings.allowNewHouseCreation) {
      alert('New house creation is currently disabled. Please try again later.');
      return;
    }

    setIsCreating(true);
    try {
      // Ensure user is authenticated before creating house
      await signInAnonymous();
      const creatorUid = await waitForAuth();
      
      // Use creator name if provided, otherwise null (will skip adding creator as member)
      const finalCreatorName = creatorName.trim() || null;
      
      const count = typeof memberCount === 'number' ? memberCount : parseInt(String(memberCount)) || 0;
      
      // Create house with unique code (retries if code exists)
      const { houseCode } = await createHouseWithUniqueCode({
        name: houseName,
        memberCount: count,
        commonAreaTasks: groupedTasks,
        members,
        soleResponsibilityTasks,
        commonAreaAssignments: {}, // Legacy, empty for new houses using bundles
        soleResponsibilityAssignments: soleResponsibilityWeeklyAssignments,
        creatorUid,
        creatorName: finalCreatorName || '', // Pass empty string if null
        commonChoreBundles: commonChoreBundles, // New: bundles
      });
      
      // Fetch house to get membersMap and schedule info
      const createdHouse = await getHouse(houseCode);
      const membersMap = createdHouse?.membersMap || {};
      const cycleLength = createdHouse?.cycleLength || count || members.length || 4;
      const scheduleStartDate = createdHouse?.scheduleStartDate 
        ? (createdHouse.scheduleStartDate.toDate ? createdHouse.scheduleStartDate.toDate() : new Date())
        : undefined;
      
      // Create reverse map: member name -> uid
      const nameToUidMap: { [name: string]: string } = {};
      Object.keys(membersMap).forEach(uid => {
        nameToUidMap[membersMap[uid].name] = uid;
      });
      
      await initializeChoresWithSchedule(
        houseCode, 
        groupedTasks, 
        soleResponsibilityTasks,
        {} as any, // Legacy assignments empty for new houses using bundles
        soleResponsibilityWeeklyAssignments as any,
        nameToUidMap,
        scheduleStartDate,
        cycleLength,
        commonChoreBundles, // New: bundles
        members // Needed for bundle assignments
      );
      
      setCreatedHouseCode(houseCode);
      setStep(5); // Show share screen
      setIsCreating(false);
    } catch (error) {
      console.error('Error creating house:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create house. Please try again.';
      alert(errorMessage);
      setIsCreating(false);
    }
  };

  // Show disabled message if house creation is not allowed
  if (!settingsLoading && siteSettings && !siteSettings.allowNewHouseCreation) {
    return (
      <div className="setup-wizard">
        <MaintenanceBanner />
        <div className="wizard-container">
          <div className="wizard-header">
            <h1>House Creation Disabled</h1>
            <p>New house creation is currently disabled. Please try again later.</p>
            <button onClick={() => navigate('/')} className="back-button">
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="setup-wizard">
      <MaintenanceBanner />
      <div className="wizard-container">
        <div className="wizard-header">
          <h1>Set Up Your House</h1>
          <div className="step-indicator">
            <div className={`step ${step >= 1 ? 'active' : ''}`}>1</div>
            <div className={`step ${step >= 2 ? 'active' : ''}`}>2</div>
            <div className={`step ${step >= 3 ? 'active' : ''}`}>3</div>
            <div className={`step ${step >= 4 ? 'active' : ''}`}>4</div>
            <div className={`step ${step >= 5 ? 'active' : ''}`}>5</div>
          </div>
        </div>

        <div className="wizard-content">
          {/* Step 1: House Name */}
          {step === 1 && (
            <div className="wizard-step">
              <h2>What's your house name?</h2>
              <p>Give your house a name to identify it</p>
              <input
                type="text"
                value={houseName}
                onChange={(e) => setHouseName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleStep1Next()}
                placeholder="e.g., Smith Residence, Apartment 5B"
                className="wizard-input"
                autoFocus
              />
              <SegmentedNav
                onPrevious={() => {
                  window.location.href = 'https://www.chorestodo.ca/';
                }}
                onNext={handleStep1Next}
                previousDisabled={false}
                nextDisabled={!houseName.trim()}
              />
            </div>
          )}

          {/* Step 2: Number of Members */}
          {step === 2 && (
            <div className="wizard-step">
              <h2>How many house members?</h2>
              <p>Enter the number of people in your house (maximum 11)</p>
              <input
                type="number"
                min="0"
                max="11"
                value={memberCount}
                onChange={handleMemberCountChange}
                className="wizard-input"
                placeholder="0"
                autoFocus
              />
              <SegmentedNav
                onPrevious={() => setStep(1)}
                onNext={handleStep2Next}
                nextDisabled={typeof memberCount === 'number' ? memberCount < 1 || memberCount >= 12 : !memberCount || parseInt(String(memberCount)) < 1 || parseInt(String(memberCount)) >= 12}
              />
            </div>
          )}

          {/* Step 3: Add Tasks */}
          {step === 3 && (
            <div className="wizard-step">
              <h2>Add Cleaning Tasks</h2>
              <p>List all the areas that need to be cleaned. Use "upstairs" or "downstairs" in task names to group them automatically.</p>
              
              <div className="task-section">
                <h3>Common Areas</h3>
                <p className="help-text">Shared areas that will be assigned to members on a rotating weekly basis.</p>
                <div className="task-input-group">
                  <input
                    type="text"
                    value={taskInput}
                    onChange={(e) => setTaskInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
                    placeholder="e.g., Kitchen"
                    className="wizard-input"
                  />
                  <button onClick={handleAddTask} className="add-task-button">
                    Add
                  </button>
                </div>
                <div className="tasks-list">
                  {tasks.map((task, index) => (
                    <div key={index} className="task-tag">
                      {task}
                      <button onClick={() => handleRemoveTask(index)} className="remove-task-button">
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="task-section">
                <h3>Fixed Chores</h3>
                <p className="help-text">Chores that don't rotate and are always handled by specific people (for example, Clean a washroom shared between two rooms).</p>
                <div className="task-input-group">
                  <input
                    type="text"
                    value={soleResponsibilityInput}
                    onChange={(e) => setSoleResponsibilityInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddSoleResponsibility()}
                    placeholder="e.g., upstairs washroom(Shared)"
                    className="wizard-input"
                  />
                  <button onClick={handleAddSoleResponsibility} className="add-task-button">
                    Add
                  </button>
                </div>
                <div className="tasks-list">
                  {soleResponsibilityTasks.map((task, index) => (
                    <div key={index} className="task-tag sole-responsibility">
                      {task}
                      <button onClick={() => handleRemoveSoleResponsibility(index)} className="remove-task-button">
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <SegmentedNav
                onPrevious={() => setStep(2)}
                onNext={handleStep3Next}
                nextDisabled={tasks.length === 0 && soleResponsibilityTasks.length === 0}
              />
            </div>
          )}

          {/* Step 4: Review and Assign */}
          {step === 4 && (
            <div className="wizard-step">
              <h2>Assign Tasks</h2>
              <p>Set up your weekly schedule. Edit member names and assign tasks.</p>
              
              <div className="members-section">
                <h3>House Members</h3>
                <div className="members-list">
                  {members.map((member, index) => (
                    <div key={index} className="member-input">
                      <label>Member {index + 1}:</label>
                      <input
                        type="text"
                        value={member}
                        onChange={(e) => handleUpdateMemberName(index, e.target.value)}
                        placeholder="Enter your roommate's first name"
                        className="member-name-input"
                        autoComplete="off"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {commonChoreBundles.length > 0 && (
                <div className="assignments-section">
                  <h3>Common Areas - Bundled Schedule</h3>
                  <p className="help-text">Common areas are bundled so each member gets at most one bundle per week. Bundles rotate weekly among all members.</p>
                  <div className="schedule-assignments">
                    {commonChoreBundles.map((bundle, bundleIndex) => (
                      <div key={bundleIndex} className="task-schedule-item">
                        <div className="task-schedule-header">
                          <span className="task-name">{bundle.title}</span>
                          {bundle.choreTitles.length > 1 && (
                            <div className="bundle-chores-preview">
                              <span className="bundle-includes">Includes: {bundle.choreTitles.join(', ')}</span>
                            </div>
                          )}
                        </div>
                        <div className="week-assignments">
                          <div className="week-assignment">
                            <label>Rotation:</label>
                            <span className="assigned-member-name">Rotates among all {members.length} members</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {soleResponsibilityTasks.length > 0 && (
                <div className="assignments-section">
                  <h3>Fixed Chores - Select Responsible Members</h3>
                  <p className="help-text">Select which members are responsible for each task. Tasks will be divided weekly among selected members equally.</p>
                  <div className="sole-assignments">
                    {soleResponsibilityTasks.map((task, index) => {
                      const selectedMembers = soleResponsibilityMemberSelections[task] || [];
                      const weeklyAssignments = soleResponsibilityWeeklyAssignments[task] || [];
                      return (
                        <div key={index} className="sole-assignment-item">
                          <div className="sole-task-header">
                            <span className="task-name">{task}</span>
                          </div>
                          <div className="member-selection">
                            <label>Select responsible members:</label>
                            <div className="member-checkboxes">
                              {members.map((member, idx) => (
                                <label key={idx} className="member-checkbox-label">
                                  <input
                                    type="checkbox"
                                    checked={selectedMembers.includes(member)}
                                    onChange={() => handleToggleSoleResponsibilityMember(task, member)}
                                    className="member-checkbox"
                                  />
                                  <span>{member || `Member ${idx + 1}`}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                          {selectedMembers.length > 0 && (
                            <div className="weekly-preview">
                              <label>Rotation assignments:</label>
                              <div className="week-assignments-preview">
                                {weeklyAssignments.map((assignment, idx) => {
                                  return (
                                    <div key={idx} className="week-preview-item">
                                      Rotation {assignment.rotationIndex + 1}: {assignment?.member || 'Unassigned'}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Creator Name Section (Optional) */}
              {isNamePromptVisible && (
                <div className="creator-name-section">
                  <h3>Your Name (Optional)</h3>
                  <p className="help-text">If you're a member of this house, you can add your name. You can skip this if you're just setting up the schedule (e.g., landlord).</p>
                  <div className="creator-name-input-wrapper">
                    <input
                      type="text"
                      value={creatorName}
                      onChange={(e) => setCreatorName(e.target.value)}
                      placeholder="Enter your name"
                      className="member-name-input"
                      autoComplete="off"
                    />
                    <button
                      onClick={() => {
                        setIsNamePromptVisible(false);
                        setCreatorName('');
                      }}
                      className="wizard-button secondary skip-button"
                    >
                      Skip
                    </button>
                  </div>
                </div>
              )}
              
              {!isNamePromptVisible && (
                <div className="creator-name-section">
                  <button
                    onClick={() => setIsNamePromptVisible(true)}
                    className="wizard-button secondary"
                    style={{ width: 'auto', marginBottom: '1rem' }}
                  >
                    + Add Your Name
                  </button>
                </div>
              )}

              <SegmentedNav
                onPrevious={() => setStep(3)}
                onNext={handleCreateHouse}
                nextLabel={isCreating ? 'Creating...' : 'Finish →'}
                nextDisabled={isCreating}
              />
            </div>
          )}

          {/* Step 5: Share House */}
          {step === 5 && createdHouseCode && (
            <div className="wizard-step">
              <h2>House Created!</h2>
              <p>Share this house code and link with your housemates</p>
              
              <div className="share-screen">
                <div className="share-info">
                  <div className="info-item">
                    <label>House Name:</label>
                    <span className="info-value">{houseName}</span>
                  </div>
                  <div className="info-item">
                    <label>House Code:</label>
                    <div className="house-code-display">
                      <span className="code-value">{createdHouseCode}</span>
                      <button 
                        onClick={async () => {
                          try {
                            await copyToClipboard(createdHouseCode);
                            alert('House code copied!');
                          } catch (error) {
                            alert('Failed to copy code. Please try again.');
                          }
                        }}
                        className="copy-button"
                      >
                        Copy Code
                      </button>
                    </div>
                  </div>
                  <div className="info-item">
                    <label>Share Link:</label>
                    <div className="share-link-display">
                      <input 
                        type="text" 
                        value={buildHouseShareLink(createdHouseCode)}
                        readOnly
                        className="share-link-input"
                      />
                      <button 
                        onClick={async () => {
                          try {
                            await copyToClipboard(buildHouseShareLink(createdHouseCode));
                            alert('Share link copied!');
                          } catch (error) {
                            alert('Failed to copy link. Please try again.');
                          }
                        }}
                        className="copy-button"
                      >
                        Copy Link
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="wizard-actions step-5-actions">
                <button 
                  onClick={() => navigate(`/house/${createdHouseCode}`)} 
                  className="wizard-button primary"
                >
                  Check Schedule
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

