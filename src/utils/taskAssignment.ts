/**
 * Check if a task contains upstairs or downstairs keywords
 */
function getTaskLocation(task: string): 'upstairs' | 'downstairs' | 'common' {
  const lowerTask = task.toLowerCase();
  if (lowerTask.includes('upstairs') || lowerTask.includes('up')) {
    return 'upstairs';
  }
  if (lowerTask.includes('downstairs') || lowerTask.includes('down')) {
    return 'downstairs';
  }
  return 'common';
}

/**
 * Group tasks by location and combine small tasks
 */
export function groupTasks(tasks: string[]): string[] {
  const grouped: string[] = [];
  const upstairs: string[] = [];
  const downstairs: string[] = [];
  const common: string[] = [];

  // Separate tasks by location
  tasks.forEach(task => {
    const location = getTaskLocation(task);
    if (location === 'upstairs') {
      upstairs.push(task);
    } else if (location === 'downstairs') {
      downstairs.push(task);
    } else {
      common.push(task);
    }
  });

  // Combine upstairs tasks if there are 2 or more small ones
  if (upstairs.length >= 2) {
    grouped.push(upstairs.join(' + '));
  } else {
    grouped.push(...upstairs);
  }

  // Combine downstairs tasks if there are 2 or more small ones
  if (downstairs.length >= 2) {
    grouped.push(downstairs.join(' + '));
  } else {
    grouped.push(...downstairs);
  }

  // Add common tasks as-is
  grouped.push(...common);

  return grouped;
}

/**
 * Randomly assign tasks to members equally
 */
export function assignTasksToMembers(
  tasks: string[],
  members: string[]
): Record<string, string> {
  if (members.length === 0 || tasks.length === 0) {
    return {};
  }

  // Shuffle tasks for random distribution
  const shuffledTasks = [...tasks].sort(() => Math.random() - 0.5);
  
  // Create assignments object
  const assignments: Record<string, string> = {};
  
  // Distribute tasks as evenly as possible
  shuffledTasks.forEach((task, index) => {
    const memberIndex = index % members.length;
    assignments[task] = members[memberIndex];
  });

  return assignments;
}

/**
 * Main function: process tasks and assign to members
 */
export function processAndAssignTasks(
  tasks: string[],
  members: string[]
): { groupedTasks: string[]; assignments: Record<string, string> } {
  // First, group tasks by location
  const groupedTasks = groupTasks(tasks);
  
  // Then assign grouped tasks to members
  const assignments = assignTasksToMembers(groupedTasks, members);
  
  return { groupedTasks, assignments };
}

/**
 * Bundle structure for common chores
 */
export interface CommonChoreBundle {
  id: string;
  title: string;
  choreTitles: string[];
}

/**
 * Builds common chore bundles ensuring at most one bundle per member per week
 * @param commonChores - Array of common chore titles
 * @param memberCount - Number of members
 * @returns Array of bundles, where bundleCount <= memberCount
 */
export function buildCommonBundles(
  commonChores: string[],
  memberCount: number
): CommonChoreBundle[] {
  if (commonChores.length === 0 || memberCount === 0) {
    return [];
  }

  // Sort chores alphabetically for deterministic bundling
  const sortedChores = [...commonChores].sort();
  
  // Number of bundles = min(memberCount, choreCount)
  const bundleCount = Math.min(memberCount, sortedChores.length);
  
  // Distribute chores evenly across bundles
  const bundles: CommonChoreBundle[] = [];
  const choresPerBundle = Math.floor(sortedChores.length / bundleCount);
  const remainder = sortedChores.length % bundleCount;
  
  let choreIndex = 0;
  for (let i = 0; i < bundleCount; i++) {
    // Some bundles get one extra chore if remainder > 0
    const bundleSize = choresPerBundle + (i < remainder ? 1 : 0);
    const bundleChores = sortedChores.slice(choreIndex, choreIndex + bundleSize);
    
    // Generate bundle title
    const bundleId = `bundle-${String.fromCharCode(65 + i)}`; // A, B, C, ...
    let bundleTitle: string;
    if (bundleChores.length === 1) {
      bundleTitle = bundleChores[0];
    } else if (bundleChores.length <= 3) {
      bundleTitle = `Common Areas Pack ${String.fromCharCode(65 + i)} (${bundleChores.join(' + ')})`;
    } else {
      bundleTitle = `Common Areas Pack ${String.fromCharCode(65 + i)} (${bundleChores.length} tasks)`;
    }
    
    bundles.push({
      id: bundleId,
      title: bundleTitle,
      choreTitles: bundleChores,
    });
    
    choreIndex += bundleSize;
  }
  
  return bundles;
}

/**
 * Gets the rotation index for a given week
 * @param scheduleStartMonday - Monday of the schedule start week
 * @param weekMonday - Monday of the target week
 * @param cycleLength - Length of the rotation cycle
 * @returns Rotation index (0 to cycleLength-1)
 */
export function getWeekRotationIndex(
  scheduleStartMonday: Date,
  weekMonday: Date,
  cycleLength: number
): number {
  const diffMs = weekMonday.getTime() - scheduleStartMonday.getTime();
  const weeksElapsed = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
  return weeksElapsed % cycleLength;
}

/**
 * Gets common chore bundle assignments for a given week
 * @param bundles - Array of common chore bundles
 * @param members - Array of member names
 * @param rotationIndex - Current rotation index (0 to cycleLength-1)
 * @returns Array of assignments: { bundleId, memberName, memberIndex }
 */
export function getCommonAssignmentsForWeek(
  bundles: CommonChoreBundle[],
  members: string[],
  rotationIndex: number
): Array<{ bundleId: string; memberName: string; memberIndex: number }> {
  if (bundles.length === 0 || members.length === 0) {
    return [];
  }

  const assignments: Array<{ bundleId: string; memberName: string; memberIndex: number }> = [];
  
  bundles.forEach((bundle, bundleIndex) => {
    // Round-robin assignment: shift by rotationIndex
    const assignedMemberIndex = (bundleIndex + rotationIndex) % members.length;
    const assignedMember = members[assignedMemberIndex];
    
    assignments.push({
      bundleId: bundle.id,
      memberName: assignedMember,
      memberIndex: assignedMemberIndex,
    });
  });
  
  return assignments;
}

/**
 * Gets the assigned member for a sole responsibility task for a given week
 * Sole responsibility tasks rotate through their responsible members
 * @param taskAssignments - Array of assignments from soleResponsibilityAssignments[task]
 * @param scheduleStartMonday - Monday of the schedule start week
 * @param weekMonday - Monday of the target week
 * @returns Assigned member name or 'Unassigned' if no responsible members
 */
export function getSoleResponsibilityAssignmentForWeek(
  taskAssignments: Array<{ member: string; rotationIndex?: number; week?: number }>,
  scheduleStartMonday: Date,
  weekMonday: Date
): string | 'Unassigned' {
  if (!taskAssignments || taskAssignments.length === 0) {
    return 'Unassigned';
  }

  // Extract unique responsible members from assignments
  const responsibleMembers = new Set<string>();
  taskAssignments.forEach((a) => {
    if (a.member) {
      responsibleMembers.add(a.member);
    }
  });

  if (responsibleMembers.size === 0) {
    return 'Unassigned';
  }

  // If only one member, always assign that member
  if (responsibleMembers.size === 1) {
    return Array.from(responsibleMembers)[0];
  }

  // Calculate weeks elapsed
  const diffMs = weekMonday.getTime() - scheduleStartMonday.getTime();
  const weeksElapsed = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));

  // Calculate rotation index within responsible members
  const responsibleMembersArray = Array.from(responsibleMembers);
  const idx = weeksElapsed % responsibleMembersArray.length;

  return responsibleMembersArray[idx];
}

