var request = require('request');

const apiOptions = {
  server: 'http://localhost:3000'
};
if (process.env.NODE_ENV === 'production') {
  apiOptions.server = 'https://loc8r-api24-zfy0.onrender.com';
}

// 홈 리스트
const homelist = (req, res) => {
  const path = '/api/locations';
  const requestOptions = {
    url: `${apiOptions.server}${path}`,
    method: 'GET',
    json: {},
    qs: {
      lng: 126.964062,
      lat: 37.468769,
      maxDistance: 200
    }
  };

  request(requestOptions, (err, response, body) => {
    if (err || !response) {
      console.error("API request failed:", err);
      return renderHomepage(req, res, []);
    }

    const { statusCode } = response;

    let data = [];
    if (statusCode === 200 && Array.isArray(body)) {
      data = body.map(item => {
        item.distance = formatDistance(item.distance);
        return item;
      });
    }

    renderHomepage(req, res, data);
  });
};

// 홈페이지 렌더링
const renderHomepage = (req, res, responseBody) => {
  let message = null;
  if (!(responseBody instanceof Array)) {
    message = "API lookup error";
    responseBody = [];
  } else if (!responseBody.length) {
    message = "No places found nearby";
  }

  res.render('locations-list', {
    title: 'Loc8r - find a place to work with wifi',
    pageHeader: {
      title: 'Loc8r',
      strapLine: 'Find places to work with wifi near you!'
    },
    sidebar: "Looking for wifi and a seat? Loc8r helps you find places to work when out and about.",
    locations: responseBody,
    message
  });
};

// 거리 포맷
const formatDistance = (distance) => {
  let thisDistance = 0;
  let unit = 'm';
  if (distance > 1000) {
    thisDistance = parseFloat(distance / 1000).toFixed(1);
    unit = 'km';
  } else {
    thisDistance = Math.floor(distance);
  }
  return thisDistance + unit;
};

// 상세 페이지 렌더링
const renderDetailPage = (req, res, location) => {
  res.render('location-info', {
    title: location.name,
    pageHeader: { title: location.name },
    sidebar: {
      context: 'is on Loc8r because it has accessible wifi and space to sit down with your laptop and get some work done.',
      callToAction: "If you've been and you like it - or if you don't - please leave a review to help other people just like you"
    },
    location
  });
};

// 에러 처리
const showError = (req, res, status) => {
  let title = '';
  let content = '';
  if (status === 404) {
    title = '404, page not found';
    content = 'Sorry, that page cannot be found.';
  } else {
    title = `${status}, something's gone wrong`;
    content = 'Something went wrong.';
  }
  res.status(status);
  res.render('generic-text', { title, content });
};

// 리뷰 폼 렌더링
const renderReviewForm = (req, res, { name }) => {
  res.render('location-review-form', {
    title: `Review ${name} on Loc8r`,
    pageHeader: { title: `Review ${name}` },
    error: req.query.err
  });
};

// 위치 정보 가져오기
const getLocationInfo = (req, res, callback) => {
  const path = `/api/locations/${req.params.locationid}`;
  const requestOptions = {
    url: `${apiOptions.server}${path}`,
    method: 'GET',
    json: {}
  };

  request(requestOptions, (err, response, body) => {
    if (err || !response) return showError(req, res, 500);

    const { statusCode } = response;

    if (statusCode === 200) {
      let data = body;
      if (body.coords && body.coords.length === 2) {
        data.coords = { lng: body.coords[0], lat: body.coords[1] };
      }
      callback(req, res, data);
    } else {
      showError(req, res, statusCode);
    }
  });
};

// 위치 상세 페이지
const locationInfo = (req, res) => {
  getLocationInfo(req, res, (req, res, responseData) =>
    renderDetailPage(req, res, responseData)
  );
};

// 리뷰 작성 페이지
const addReview = (req, res) => {
  getLocationInfo(req, res, (req, res, responseData) =>
    renderReviewForm(req, res, responseData)
  );
};

// 리뷰 등록
const doAddReview = (req, res) => {
  const locationid = req.params.locationid;
  const path = `/api/locations/${locationid}/reviews`;

  const postdata = {
    author: req.body.name,
    rating: parseInt(req.body.rating, 10),
    reviewText: req.body.review
  };

  if (!postdata.author || !postdata.rating || !postdata.reviewText) {
    return res.redirect(`/location/${locationid}/review/new?err=val`);
  }

  const requestOptions = {
    url: `${apiOptions.server}${path}`,
    method: 'POST',
    json: postdata
  };

  request(requestOptions, (err, response, body) => {
    if (err || !response) return showError(req, res, 500);

    const { statusCode } = response;

    if (statusCode === 201) {
      res.redirect(`/location/${locationid}`);
    } else if (statusCode === 400 && body && body.name === 'ValidationError') {
      res.redirect(`/location/${locationid}/review/new?err=val`);
    } else {
      showError(req, res, statusCode);
    }
  });
};

module.exports = {
  homelist,
  locationInfo,
  addReview,
  doAddReview
};
