module.exports = {
  date: {
    type: Date,
    index: true
  },
  instagram_id: {
    type: String,
    index: true
  },
  type: String,
  filter: String,
  tags: [String],
  caption: String,
  link: String,
  created_time: String,
  user: {
    username: String,
    profile_picture: String,
    id: String,
    full_name: String
  },
  images: {
    low_resolution: {
      url: { type: String, index: true },
      width: Number,
      height: Number
    },
    thumbnail: {
      url: { type: String, index: true },
      width: Number,
      height: Number
    },
    standard_resolution: {
      url: { type: String, index: true },
      width: Number,
      height: Number
    }
  }
};
