module.exports = function formatter(post) {
  return {
    date: new Date(),
    instagram_id: post.id,
    type: post.type,
    filter: post.filter,
    tags: post.tags,
    caption: post.caption ? post.caption.text || '' : '',
    link: post.link,
    created_time: post.created_time,
    user: post.user,
    images: post.images
  };
};
