// Serve a healthcheck endpoint that shows the uptime of the process.
const healthcheck = async (req, res) => {
    res.status(200).json({
        message: 'OK',
        uptime: process.uptime(),
        timestamp: Date.now(),
    });
};

export { healthcheck };
