/**
 * Type for description of outcomes
 * @author Gabe Abrams
 */
declare type OutcomeDescription = {
    url: string;
    sourcedId: string;
    urlSubmissionAccepted: boolean;
    textSubmissionAccepted: boolean;
    totalScoreAccepted: boolean;
    submittedAtAccepted: boolean;
};
export default OutcomeDescription;
