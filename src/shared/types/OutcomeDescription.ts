/**
 * Type for description of outcomes
 * @author Gabe Abrams
 */
interface OutcomeDescription {
  // The outcome service url
  url: string,
  // The LTI passback sourcedid
  sourcedId: string,
  // True if url submissions are accepted
  urlSubmissionAccepted: boolean,
  // True if text submissions are accepted
  textSubmissionAccepted: boolean,
  // True if the total score is accepted
  totalScoreAccepted: boolean,
  // True if the submittedAt timestamp is accepted
  submittedAtAccepted: boolean,
};

export default OutcomeDescription;
