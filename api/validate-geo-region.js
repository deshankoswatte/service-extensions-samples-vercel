const geoip = require('geoip-country');

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    const additionalHeaders = req.body?.event?.request?.additionalHeaders;
    const allowedCountries = ['United States'];
    let clientIp = '101.2.176.0';

    if (Array.isArray(additionalHeaders)) {
        const ipHeaderEntry = additionalHeaders.find(
            (header) => header.name?.toLowerCase() === 'x-client-source-ip'
        );
        if (ipHeaderEntry?.value?.[0]) {
            clientIp = ipHeaderEntry.value[0];
        }
    }

    if (clientIp === '101.2.176.0') {
        return res.status(200).json({
            actionStatus: 'FAILED',
            failureReason: 'ip_not_resolved',
            failureDescription: 'Unable to determine the IP.',
        });
    }

    const geo = geoip.lookup(clientIp);
    const countryName = geo?.name;

    if (allowedCountries.includes(countryName)) {
        return res.status(200).json({
            actionStatus: 'FAILED',
            failureReason: 'geo_request',
            failureDescription: `Access token issuance is blocked from your region: ${countryName}`,
        });
    }

    return res.status(200).json({ actionStatus: 'SUCCESS' });
};
