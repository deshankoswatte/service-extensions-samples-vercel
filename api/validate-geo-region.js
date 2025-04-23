const geoip = require('geoip-lite');
const countries = require('i18n-iso-countries');

// Load language (e.g., English)
countries.registerLocale(require("i18n-iso-countries/langs/en.json"));

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    const additionalHeaders = req.body?.event?.request?.additionalHeaders;
    const disAllowedCountries = ['United States of America'];
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
    let countryName = "";
    if (geo) {
        countryName = countries.getName(geo.country, "en");
        console.log({
            ...geo,
            name: countryName
        });
    } else {
        console.log("Geo info not found");
        return res.status(200).json({
            actionStatus: 'FAILED',
            failureReason: 'geo_request',
            failureDescription: `Geo location could not be decided.`,
        });
    }

    if (countryName.length < 1 || disAllowedCountries.includes(countryName)) {
        return res.status(200).json({
            actionStatus: 'FAILED',
            failureReason: 'geo_request',
            failureDescription: `Access token issuance is blocked from your region: ${countryName}`,
        });
    }

    return res.status(200).json({ actionStatus: 'SUCCESS' });
};
