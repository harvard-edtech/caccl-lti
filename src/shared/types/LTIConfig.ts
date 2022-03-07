// Import libs
import express from 'express';

// Import caccl libs
import InitCACCLStore from 'caccl-memory-store/lib/InitCACCLStore';

// Import shared types
import InstallationCredentials from './InstallationCredentials';
import SelfLaunchConfig from './SelfLaunchConfig';

/**
 * Config options for caccl-lti
 * @author Gabe Abrams
 */
type LTIConfig = {
  app: express.Application,
  installationCredentials: InstallationCredentials,
  initNonceStore?: InitCACCLStore,
  selfLaunch?: SelfLaunchConfig,
  authorizeAfterLaunch?: boolean,
};

export default LTIConfig;
