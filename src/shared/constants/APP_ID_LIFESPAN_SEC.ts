/**
 * The number of seconds to keep appIds
 * @author Gabe Abrams
 */
const APP_ID_LIFESPAN_SEC = (
  process.env.APP_ID_LIFESPAN_SEC
    ? Number.parseFloat(process.env.APP_ID_LIFESPAN_SEC)
    : 2 * 86400 // 2 days
);

export default APP_ID_LIFESPAN_SEC;