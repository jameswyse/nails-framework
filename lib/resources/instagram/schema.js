module.exports = {
  date: Date,
  instagram_id: String,
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
      url: String,
      width: Number,
      height: Number
    },
    thumbnail: {
      url: String,
      width: Number,
      height: Number
    },
    standard_resolution: {
      url: String,
      width: Number,
      height: Number
    }
  }
};
