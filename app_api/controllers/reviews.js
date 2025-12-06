const mongoose = require('mongoose');
const Loc = mongoose.model('Location');
const User = mongoose.model('User');

// 평균 평점 계산
const doSetAverageRating = async (location) => {
  if (location.reviews && location.reviews.length > 0) {
    const count = location.reviews.length;
    const total = location.reviews.reduce((acc, { rating }) => acc + rating, 0);
    location.rating = parseInt(total / count, 10);
    try {
      await location.save();
      console.log(`Average rating updated to ${location.rating}`);
    } catch (err) {
      console.log(err);
    }
  }
};

// 리뷰 추가
const doAddReview = async (req, res, location, author) => {
  if (!location) {
    return res.status(404).json({ message: "Location not found" });
  }

  const { rating, reviewText } = req.body;
  location.reviews.push({ author, rating, reviewText });

  try {
    const updatedLocation = await location.save();
    await updateAverageRating(updatedLocation._id);
    const thisReview = updatedLocation.reviews.slice(-1).pop();
    return res.status(201).json(thisReview);
  } catch (err) {
    return res.status(400).json(err);
  }
};

// 평균 평점 업데이트
const updateAverageRating = async (locationId) => {
  try {
    const location = await Loc.findById(locationId).select('rating reviews').exec();
    if (location) {
      await doSetAverageRating(location);
    }
  } catch (err) {
    console.log(err);
  }
};

// 리뷰 생성
const reviewsCreate = async (req, res) => {
  if (!req.auth || !req.auth.email) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const user = await User.findOne({ email: req.auth.email }).exec();
    if (!user) return res.status(404).json({ message: "User not found" });

    const locationId = req.params.locationid;
    const location = await Loc.findById(locationId).select('reviews').exec();
    if (!location) return res.status(404).json({ message: "Location not found" });

    await doAddReview(req, res, location, user.name);
  } catch (err) {
    return res.status(400).json(err);
  }
};

// 단일 리뷰 조회
const reviewsReadOne = async (req, res) => {
  try {
    const location = await Loc.findById(req.params.locationid).select('name reviews').exec();
    if (!location) return res.status(404).json({ message: "Location not found" });

    const review = location.reviews.id(req.params.reviewid);
    if (!review) return res.status(404).json({ message: "Review not found" });

    return res.status(200).json({
      location: { name: location.name, id: req.params.locationid },
      review
    });
  } catch (err) {
    return res.status(400).json(err);
  }
};

// 리뷰 업데이트
const reviewsUpdateOne = async (req, res) => {
  const { locationid, reviewid } = req.params;
  if (!locationid || !reviewid) return res.status(404).json({ message: "locationid and reviewid required" });

  try {
    const location = await Loc.findById(locationid).select('reviews').exec();
    if (!location) return res.status(404).json({ message: "Location not found" });

    const thisReview = location.reviews.id(reviewid);
    if (!thisReview) return res.status(404).json({ message: "Review not found" });

    thisReview.author = req.body.author || thisReview.author;
    thisReview.rating = req.body.rating || thisReview.rating;
    thisReview.reviewText = req.body.reviewText || thisReview.reviewText;

    const updatedLocation = await location.save();
    await updateAverageRating(updatedLocation._id);
    return res.status(200).json(thisReview);
  } catch (err) {
    return res.status(400).json(err);
  }
};

// 리뷰 삭제
const reviewsDeleteOne = async (req, res) => {
  const { locationid, reviewid } = req.params;
  if (!locationid || !reviewid) return res.status(404).json({ message: "locationid and reviewid required" });

  try {
    const location = await Loc.findById(locationid).select('reviews').exec();
    if (!location) return res.status(404).json({ message: "Location not found" });

    const review = location.reviews.id(reviewid);
    if (!review) return res.status(404).json({ message: "Review not found" });

    review.remove();
    await location.save();
    await updateAverageRating(location._id);
    return res.status(204).json(null);
  } catch (err) {
    return res.status(400).json(err);
  }
};

module.exports = {
  reviewsCreate,
  reviewsReadOne,
  reviewsUpdateOne,
  reviewsDeleteOne
};
