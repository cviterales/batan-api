const axios = require("axios").default;
const db = require("../models");
const Channel = db.channels;
const Preview = db.previews;

const formatResponses = (object) => {
  let newFormat = [];

  object.items.forEach((video) => {
    const { id, snippet } = video;
    let formatedVideoData = {
      videoId: id.videoId,
      publishedAt: snippet.publishedAt,
      channelId: snippet.channelId,
      title: snippet.title,
      description: snippet.description,
      thumbnails: snippet.thumbnails,
    };

    newFormat.push(formatedVideoData);
  });
  return newFormat;
};

const getChannelsIDs = (random, res) => {
  Channel.find({})
    .then((data) => {
      let transformedResponse = JSON.stringify(data);
      let channels_ids = JSON.parse(transformedResponse).map(
        (item) => item.media.youtube_id
      );
      res.send(channels_ids);
    })
    .catch((err) => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving channels.",
      });
    });
};

const getPreviews = async (channel_id, res) => {
  const key = "AIzaSyAxgOxgraVNuvTyYdz9iy3E6DDLbOwEZwo";
  let response = [];

  const config = {
    params: {
      key,
      channelId: channel_id,
      part: "snippet",
      order: "date",
      maxResults: "8",
    },
    headers: {
      "Content-Type": "application/json",
    },
  };
  response = await axios.get("https://www.googleapis.com/youtube/v3/search", config)
  return formatResponses(response.data);
};

const savePreviews = async (previews) => {
  return previews.map((preview) => {
    // find preview if exists, update preview found else insert new preview
    Preview.find({ videoId: preview.videoId })
      .then((result) => {
        if (result.length === 0) {
          let objectPreview = new Preview(preview);
          objectPreview.save((err) => {
            return err;
          });
        } else {
          let objectPreview = new Preview(preview);
          let set = {
            videoId: objectPreview.videoId,
            publishedAt: objectPreview.publishedAt,
            channelId: objectPreview.channelId,
            title: objectPreview.title,
            description: objectPreview.description,
          };
          Preview.updateOne(
            { videoId: objectPreview.videoId },
            { $set: set }
          ).catch((err) => {
            return err;
          });
        }
      })
      .catch((err) => {
        return err;
      });
  });
};

exports.updatePreviews = async (req, res) => {
  // Validate request

  if (!req.body.youtube_id) {
    res.status(400).send({ message: "Content can not be empty!" });
    return;
  }

  const previews = await getPreviews(req.body.youtube_id, res);
  // Save channel in the database
  if (previews && previews.length > 0) {
    await savePreviews(previews)
      .then(() => {
        res.send("Previews update successful!");
      })
      .catch((err) => {
        res.status(500).send({
          message:
            err.message || "Some error occurred while creating the Channel.",
        });
      });
  } else {
    res.status(500).send({
      message: "Some error occurred while creating the Channel.",
    });
  }
};
