# NonceStore

Class definition for a custom nonce store. This store needs to have the following methods.

## Methods

### check(nonce, timestampSecs)

Checks that the timestamp is current and the nonce has not yet been used, records the nonce and marks it as used.

Argument | Type | Description
:--- | :--- | :---
nonce | string | the oauth nonce to check
timestampSecs | string or number | the oauth timestamp in seconds

**Returns:**  
`Promise` Promise that resolves if the nonce and/or timestamp are valid, rejects with string error message if the nonce and/or timestamp is invalid. See error messages below:

"No nonce included." - If no nonce was included.  
"No timestamp." - If no timestamp was included.  
"Timestamp is not a number." - If timestamp is not a number.  
"Nonce too old." – If timestamp is before the start of tracking nonces.  
"Nonce expired." – If timestamp is older than 1 minute.  
"Nonce already used." – If nonce has already been used.
