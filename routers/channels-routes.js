module.exports = app => {
  const channel = require("../controllers/channels-controller");
  const preview = require("../controllers/previews-controller");

  var router = require("express").Router();

  // Create a new Channel
  router.post("/preview/update", preview.updatePreviews);

  // Create a new Channel
  router.post("/", channel.create);

  // Retrieve all channel
  router.get("/", channel.findAll);

  // Retrieve a single Channel with id
  router.get("/:id", channel.findOne);

  // Retrieve a single Channel Preview items
  router.get("/preview/:id", channel.findPreviews);

  // Update a Channel with id
  router.put("/:id", channel.update);

  // Delete a Channel with id
  router.delete("/:id", channel.delete);

  // Create a new Channel
  router.delete("/", channel.deleteAll);

  app.use('/channels', router);
};