// .Router関数
const router = require("express").Router();
const Post = require("../models/Post");
const User = require("../models/User");

// Create post
router.post("/", async (req, res) => {
  // インスタンス化したSchemaにreq.bodyを指定するとSchemaの情報を含んだpostが作れる
  const newPost = new Post(req.body);
  try {
    // 作った新しいポストをセーブする
    const savedPost = await newPost.save();
    // saveしたpostを返す
    return res.status(200).json(savedPost);
  } catch (err) {
    return res.status(500).json(err);
  }
});
// --------------------------------------------------------------------------------
//Update post
router.put("/:id", async (req, res) => {
  try {
    // postに更新した後の情報が入ってくる
    //.findByIdで投稿したPostを探してくる
    const post = await Post.findById(req.params.id);
    // postのuserIdがログインしているuserIdと同じだったら編集可
    //req.body.userIdは編集しようとしているpostのid
    if (post.userId === req.body.userId) {
      // 編集した投稿をupdateする
      await post.updateOne({
        $set: req.body,
      });
      return res.status(200).json("Updated!");
    } else {
      return res.status(403).json("You can not edit this post.");
    }
  } catch (err) {
    return res.status(403).json(err);
  }
});
// --------------------------------------------------------------------------------
//Delete post
router.delete("/:id", async (req, res) => {
  try {
    //.findByIdで投稿したPostを探してくる
    const post = await Post.findById(req.params.id);
    // postのuserIdがログインしているuserIdと同じだったら削除可
    //req.body.userIdは編集しようとしているpostのid
    if (post.userId === req.body.userId) {
      // 投稿を削除する
      await post.deleteOne();
      return res.status(200).json("Deleted!!");
    } else {
      return res.status(403).json("You can not delete this post.");
    }
  } catch (err) {
    return res.status(403).json(err);
  }
});
// --------------------------------------------------------------------------------
//Get one specific post
router.get("/:id", async (req, res) => {
  try {
    //.findByIdで見たいPostを探してくる
    const post = await Post.findById(req.params.id);
    return res.status(200).json(post);
  } catch (err) {
    return res.status(403).json(err);
  }
});
// --------------------------------------------------------------------------------
// Like
router.put("/:id/like", async (req, res) => {
  // 自分の投稿もLikeできる

  try {
    // likeしたい投稿を見つける
    // req.params.idはlikeしたい投稿のid
    const post = await Post.findById(req.params.id);
    // まだ投稿にLikeが押されてなかったら...

    if (!post.likes.includes(req.body.userId)) {
      await post.updateOne({
        $push: {
          likes: req.body.userId,
        },
      });

      return res.status(200).json("Liked!");
      // 投稿にLikeされてたら...
    } else {
      // LikeしているuserIdを取り除く
      await post.updateOne({
        $pull: {
          likes: req.body.userId,
        },
      });
      return res.status(403).json("Unliked!");
    }
  } catch (err) {
    return res.status(500).json(err);
  }
});
// --------------------------------------------------------------------------------
// Get user profile timeline
router.get("/profile/:username", async (req, res) => {
  try {
    // ログインしているuserの情報
    const user = await User.findOne({ username: req.params.username });
    // ↑からとってきたUserの全部のpost情報を取得
    const posts = await Post.find({ userId: user._id });

    return res.status(200).json(posts);
  } catch (err) {
    return res.status(500).json(err);
  }
});
// --------------------------------------------------------------------------------
// Get all timeline
router.get("/timeline/:userId", async (req, res) => {
  try {
    // ログインしているuserの情報
    const currentUser = await User.findById(req.params.userId);
    // ↑からとってきたUserの全部のpost情報を取得
    const userPosts = await Post.find({ userId: currentUser._id });
    // currentUserがフォローしているuserのpost情報をすべて取得
    // friendPostsはcurrentUserを使っている。currentUserは非同期処理でいつデータが全部取得できるかわからない。
    // だからpromise.allを使って、currentUserが情報を取得するまで待つ。
    const friendPosts = await Promise.all(
      currentUser.followings.map((friendId) => {
        return Post.find({ userId: friendId });
      })
    );

    return res.status(200).json(userPosts.concat(...friendPosts));
  } catch (err) {
    return res.status(500).json(err);
  }
});

module.exports = router;
