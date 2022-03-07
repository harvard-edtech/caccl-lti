/**
 * The number of seconds to keep nonces. Must expire a few seconds before this
 * @author Gabe Abrams
 */
const NONCE_LIFESPAN_SEC = (
  process.env.NONCE_LIFESPAN_SEC
    ? Number.parseFloat(process.env.NONCE_LIFESPAN_SEC)
    : 60
);

export default NONCE_LIFESPAN_SEC;