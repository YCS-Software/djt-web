/**
 * Review Controller
 */

const { Review, ChargingStation, EvDriver, Session, AuditLog } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const logger = require('../utils/logger');

/**
 * List reviews
 */
exports.list = async (req, res) => {
  try {
    const { page = 1, limit = 20, stationId, driverId, rating, partnerId } = req.query;
    const offset = (page - 1) * limit;

    const where = {};

    if (stationId) {
      where.stationId = stationId;
    }

    if (driverId) {
      where.driverId = driverId;
    }

    if (rating) {
      where.rating = parseInt(rating);
    }

    const stationWhere = {};
    if (req.partnerScope) {
      stationWhere.partnerId = req.partnerScope;
    } else if (partnerId) {
      stationWhere.partnerId = partnerId;
    }

    const { count, rows } = await Review.findAndCountAll({
      where,
      include: [
        {
          model: ChargingStation,
          as: 'station',
          where: Object.keys(stationWhere).length > 0 ? stationWhere : undefined,
          attributes: ['id', 'name'],
          include: [{ association: 'location', attributes: ['name', 'city'] }],
        },
        {
          model: EvDriver,
          as: 'driver',
          attributes: ['id', 'name'],
        },
      ],
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']],
    });

    res.json({
      reviews: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    });

  } catch (error) {
    logger.error('List reviews error', { error: error.message });
    res.status(500).json({ error: 'Failed to list reviews' });
  }
};

/**
 * Get review by ID
 */
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await Review.findByPk(id, {
      include: [
        {
          model: ChargingStation,
          as: 'station',
          include: [{ association: 'location' }],
        },
        { model: EvDriver, as: 'driver', attributes: ['id', 'name'] },
        { model: Session, as: 'session' },
      ],
    });

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    res.json({ review });

  } catch (error) {
    logger.error('Get review error', { error: error.message });
    res.status(500).json({ error: 'Failed to get review' });
  }
};

/**
 * Create review
 */
exports.create = async (req, res) => {
  try {
    const { stationId, sessionId, driverId, rating, comment, categories } = req.body;

    // Verify station exists
    const station = await ChargingStation.findByPk(stationId);
    if (!station) {
      return res.status(404).json({ error: 'Station not found' });
    }

    // Check for existing review for this session
    if (sessionId) {
      const existing = await Review.findOne({
        where: { sessionId, driverId },
      });

      if (existing) {
        return res.status(400).json({ error: 'Review already exists for this session' });
      }
    }

    const review = await Review.create({
      stationId,
      sessionId,
      driverId,
      rating,
      comment,
      categories, // { cleanliness: 4, speed: 5, reliability: 4 }
      isVerified: !!sessionId, // Verified if linked to a session
    });

    // Update station average rating
    await updateStationRating(stationId);

    // Audit log
    await AuditLog.create({
      userId: req.user?.id,
      partnerId: station.partnerId,
      action: 'create',
      resource: 'review',
      resourceId: review.id,
      details: { stationId, rating },
      ipAddress: req.ip,
    });

    logger.info('Review created', { reviewId: review.id, stationId, rating });

    res.status(201).json({ review });

  } catch (error) {
    logger.error('Create review error', { error: error.message });
    res.status(500).json({ error: 'Failed to create review' });
  }
};

/**
 * Update review
 */
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment, categories } = req.body;

    const review = await Review.findByPk(id);

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Only allow driver who created it or admin to update
    if (req.user?.role !== 'super_admin' && review.driverId !== req.user?.driverId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await review.update({
      rating: rating !== undefined ? rating : review.rating,
      comment: comment !== undefined ? comment : review.comment,
      categories: categories !== undefined ? categories : review.categories,
      updatedAt: new Date(),
    });

    // Update station average rating
    await updateStationRating(review.stationId);

    logger.info('Review updated', { reviewId: id });

    res.json({ review });

  } catch (error) {
    logger.error('Update review error', { error: error.message });
    res.status(500).json({ error: 'Failed to update review' });
  }
};

/**
 * Delete review
 */
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await Review.findByPk(id);

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    const stationId = review.stationId;

    await review.destroy();

    // Update station average rating
    await updateStationRating(stationId);

    // Audit log
    await AuditLog.create({
      userId: req.user.id,
      action: 'delete',
      resource: 'review',
      resourceId: id,
      ipAddress: req.ip,
    });

    logger.info('Review deleted', { reviewId: id });

    res.json({ message: 'Review deleted successfully' });

  } catch (error) {
    logger.error('Delete review error', { error: error.message });
    res.status(500).json({ error: 'Failed to delete review' });
  }
};

/**
 * Reply to review (by partner/admin)
 */
exports.reply = async (req, res) => {
  try {
    const { id } = req.params;
    const { reply } = req.body;

    const review = await Review.findByPk(id, {
      include: [{ model: ChargingStation, as: 'station' }],
    });

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Check partner scope
    if (req.partnerScope && review.station?.partnerId !== req.partnerScope) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await review.update({
      reply,
      repliedAt: new Date(),
      repliedBy: req.user.id,
    });

    logger.info('Reply added to review', { reviewId: id });

    res.json({ message: 'Reply added', review });

  } catch (error) {
    logger.error('Reply to review error', { error: error.message });
    res.status(500).json({ error: 'Failed to add reply' });
  }
};

/**
 * Get reviews for a station
 */
exports.getByStation = async (req, res) => {
  try {
    const { stationId } = req.params;
    const { page = 1, limit = 10, rating } = req.query;
    const offset = (page - 1) * limit;

    const where = { stationId };
    if (rating) {
      where.rating = parseInt(rating);
    }

    const { count, rows } = await Review.findAndCountAll({
      where,
      include: [
        { model: EvDriver, as: 'driver', attributes: ['id', 'name'] },
      ],
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']],
    });

    // Get rating distribution
    const distribution = await Review.findAll({
      where: { stationId },
      attributes: [
        'rating',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      group: ['rating'],
      raw: true,
    });

    // Get average rating
    const avgRating = await Review.findOne({
      where: { stationId },
      attributes: [
        [sequelize.fn('AVG', sequelize.col('rating')), 'average'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
      ],
      raw: true,
    });

    res.json({
      reviews: rows,
      summary: {
        average: parseFloat(avgRating?.average || 0).toFixed(1),
        total: parseInt(avgRating?.total || 0),
        distribution: distribution.reduce((acc, d) => {
          acc[d.rating] = parseInt(d.count);
          return acc;
        }, {}),
      },
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    });

  } catch (error) {
    logger.error('Get station reviews error', { error: error.message });
    res.status(500).json({ error: 'Failed to get reviews' });
  }
};

/**
 * Update station's average rating
 */
async function updateStationRating(stationId) {
  const result = await Review.findOne({
    where: { stationId },
    attributes: [
      [sequelize.fn('AVG', sequelize.col('rating')), 'avgRating'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'reviewCount'],
    ],
    raw: true,
  });

  await ChargingStation.update(
    {
      averageRating: parseFloat(result?.avgRating || 0).toFixed(1),
      reviewCount: parseInt(result?.reviewCount || 0),
    },
    { where: { id: stationId } }
  );
}
