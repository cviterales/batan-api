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
  //console.log(channel_id);
  return await axios
    .get("https://www.googleapis.com/youtube/v3/search", config)
    .then((response) => {
      return formatResponses(response.data);
    })
    .catch((err) => {
      console.log("ERROR", err.response.data.error.message);
      return response;
    });

  //return response; //formatResponses(response.data);
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

exports.getInfoChannels = (random, res) => {
  Channel.find({})
    .then((data) => {
      let transformedResponse = JSON.stringify(data);
      let channels_ids = JSON.parse(transformedResponse).map((item) => {
        return { title: item.title, yt_id: item.media.youtube_id };
      });
      //return channels_ids;
      res.send(channels_ids);
    })
    .catch((err) => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving channels.",
      });
    });
};

const getChannelsIDs = async (res) => {
  return Channel.find({})
    .then((data) => {
      let transformedResponse = JSON.stringify(data);
      let channels_ids = JSON.parse(transformedResponse).map(
        (item) => {
          return { title: item.title, youtube_id: item.media.youtube_id };
        }
      );
      return channels_ids;
      //res.send(channels_ids);
    })
    .catch((err) => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving channels.",
      });
    });
};

exports.updatePreviews = async (req, res) => {
  // Validate request
  const channelsIds = await getChannelsIDs(res);
  if (channelsIds && channelsIds.length > 0) {
    let channelsUpdated = [];
    for await (channel of channelsIds) {
      const previews = await getPreviews(channel.youtube_id, res);
      // Save channel in the database
      //console.log("CHANNEL", channel_id, previews);
      if (previews && previews.length > 0) {
        await savePreviews(previews)
        .then((err) => {
          let updated = {
            title: channel.title,
            channel_id: channel.youtube_id,
            updated: previews.length,
          };
          console.log("UPDATED", updated);
          channelsUpdated.push(updated);
        })
        .catch((err) => {
          let updated = {
            title: channel.title,
            channel_id: channel.youtube_id,
            updated: previews.length,
            err: err,
          };
          console.log("Error", updated);
          channelsUpdated.push(updated);
        })
      } else {
        let updated = {
          title: channel.title,
          channel_id: channel.youtube_id,
          updated: previews.length,
          err: "No hay videos nuevos para actualizar",
        };
        console.log("Error", updated);
        channelsUpdated.push(updated);
      }
    }
    if (channelsUpdated.length > 0) {
      res.send({
        message: "Previews update successful!",
        updated: channelsUpdated,
      });
    }
  } else {
    res.status(500).send({
      message: "Some error occurred while creating the Channel.",
    });
  }
};

exports.updatePreview = async (req, res) => {
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
