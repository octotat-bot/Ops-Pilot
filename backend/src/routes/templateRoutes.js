const express = require('express');
const templateController = require('../controllers/templateController');
const authController = require('../controllers/authController');

const router = express.Router();

router.use(authController.protect);

router
    .route('/')
    .get(templateController.getAllTemplates)
    .post(authController.restrictTo('admin'), templateController.createTemplate);

router
    .route('/:id')
    .get(templateController.getTemplate)
    .patch(authController.restrictTo('admin'), templateController.updateTemplate)
    .delete(authController.restrictTo('admin'), templateController.deleteTemplate);

router.get('/:id/versions', authController.restrictTo('admin'), templateController.getTemplateVersions);
router.post('/:id/revert/:versionNumber', authController.restrictTo('admin'), templateController.revertToVersion);

module.exports = router;
