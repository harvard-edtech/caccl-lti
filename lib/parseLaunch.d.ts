import express from 'express';
import LaunchInfo from './types/LaunchInfo';
declare module 'express-session' {
    interface SessionData {
        launchInfo: LaunchInfo;
        authInfo: unknown;
    }
}
/**
 * Parses an LTI launch body and saves results to the session under
 *   req.session.launched (set to true) and req.session.launchInfo (contains
 *   all launch information...see /docs/LaunchInfo.md for more info)
 * @author Gabe Abrams
 * @param req express request instance
 */
declare const parseLaunch: (req: express.Request) => Promise<unknown>;
export default parseLaunch;
