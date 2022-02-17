/**
 * Type of a launch assignment
 * @author Gabe Abrams
 */
interface LaunchAssignment {
  // Canvas id for the assignment
  id: number,
  // Name of the assignment
  name: string,
  // Number of points possible
  pointsPossible: number,
};

export default LaunchAssignment;
