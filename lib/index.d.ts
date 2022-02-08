import express from 'express';
import NonceStore from './types/NonceStore';
import LaunchInfo from './types/LaunchInfo';
declare const _default: {
    init: (opts: {
        app: express.Application;
        installationCredentials: {
            consumer_key: string;
            consumer_secret: string;
        };
        authorizeAfterLaunch?: boolean;
        nonceStore?: NonceStore;
    }) => void;
    parseReq: (req: express.Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>) => {
        launched: boolean;
        launchInfo?: LaunchInfo;
    };
};
export default _default;
