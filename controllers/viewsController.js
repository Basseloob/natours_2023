exports.getOverview = (req, res) => {
  res.status(200).render('overview.pug', {
    tour: 'All Tours',
    user: 'Basil Baragaba',
  });
};

exports.getTour = (req, res) => {
  res.status(200).render('tour.pug', {
    tour: 'The Forest Hiker',
    user: 'Basil Baragaba',
  });
};
