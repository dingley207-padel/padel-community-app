// Quick test to verify route registration
const express = require('express');

// Simulate the route structure
const router = express.Router();

// These are in the order they appear in communityRoutes.ts
router.get('/', (req, res) => res.send('GET /'));
router.get('/my-communities', (req, res) => res.send('GET /my-communities'));
router.get('/manager/communities', (req, res) => res.send('GET /manager/communities'));
router.get('/:id', (req, res) => res.send('GET /:id'));
router.post('/', (req, res) => res.send('POST /'));
router.put('/:id', (req, res) => res.send('PUT /:id'));
router.post('/:id/join', (req, res) => res.send('POST /:id/join'));
router.post('/:id/leave', (req, res) => res.send('POST /:id/leave'));
router.post('/:id/notifications', (req, res) => res.send('POST /:id/notifications'));
router.get('/:id/sub-communities', (req, res) => res.send('GET /:id/sub-communities'));
router.post('/:id/sub-communities', (req, res) => res.send('POST /:id/sub-communities'));
router.delete('/:id/sub-communities/:subCommunityId', (req, res) => {
  console.log('DELETE route matched!');
  console.log('Params:', req.params);
  res.send('DELETE /:id/sub-communities/:subCommunityId');
});
router.post('/:id/join-with-subs', (req, res) => res.send('POST /:id/join-with-subs'));

const app = express();
app.use('/communities', router);

// Test the delete route
const testUrl = '/communities/test-community-id/sub-communities/test-sub-id';
console.log('Testing route:', testUrl);

app.listen(3001, () => {
  console.log('\nTest server running on http://localhost:3001');
  console.log('Try: curl -X DELETE http://localhost:3001' + testUrl);
  console.log('\nPress Ctrl+C to stop');
});
