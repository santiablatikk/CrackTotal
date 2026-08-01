/**
 * ApiFootballMapper — API-Football responses → Hub internal shapes.
 * UI must never see raw provider payloads.
 */
(function () {
    'use strict';

    const Services = (window.CrackTotalServices = window.CrackTotalServices || {});

    function shortName(name) {
        const value = String(name || '').trim();
        if (!value) return '';
        const parts = value.split(/\s+/);
        if (parts.length === 1) return parts[0].slice(0, 3).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1].slice(0, 2)).toUpperCase();
    }

    function mapStatus(short) {
        const code = String(short || '').toUpperCase();
        if (['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE', 'INT'].includes(code)) return 'live';
        if (['FT', 'AET', 'PEN'].includes(code)) return 'finished';
        if (['NS', 'TBD', 'PST'].includes(code)) return 'scheduled';
        return 'scheduled';
    }

    function mapFixture(item) {
        if (!item) return null;
        const fixture = item.fixture || {};
        const league = item.league || {};
        const teams = item.teams || {};
        const goals = item.goals || {};
        const statusShort = fixture.status && fixture.status.short;
        const status = mapStatus(statusShort);
        const homeName = (teams.home && teams.home.name) || '';
        const awayName = (teams.away && teams.away.name) || '';
        const venue = (fixture.venue && (fixture.venue.name || fixture.venue.city)) || '';

        return {
            id: String(fixture.id || league.id + '-' + homeName + '-' + awayName),
            competition: league.name || '',
            home: {
                name: homeName,
                short: shortName(homeName),
                score: goals.home == null ? null : Number(goals.home)
            },
            away: {
                name: awayName,
                short: shortName(awayName),
                score: goals.away == null ? null : Number(goals.away)
            },
            minute: fixture.status && fixture.status.elapsed != null ? Number(fixture.status.elapsed) : null,
            kickoff: fixture.date || null,
            finishedAt: status === 'finished' ? fixture.date || null : null,
            status: status,
            venue: venue
        };
    }

    function mapFixtureList(response, limit) {
        const list = Array.isArray(response) ? response : [];
        const items = list
            .map(mapFixture)
            .filter(Boolean)
            .slice(0, typeof limit === 'number' ? limit : list.length);
        return {
            updatedAt: new Date().toISOString(),
            items: items
        };
    }

    function mapCompetitions(response, limit) {
        const list = Array.isArray(response) ? response : [];
        const items = list.slice(0, limit || list.length).map((row) => {
            const league = row.league || row;
            const country = row.country || {};
            return {
                id: String(league.id || ''),
                name: league.name || '',
                country: country.name || '',
                logo: league.logo || '',
                type: league.type || '',
                season: Array.isArray(row.seasons)
                    ? (row.seasons.find((s) => s.current) || row.seasons[0] || {}).year
                    : null
            };
        });
        return {
            updatedAt: new Date().toISOString(),
            items: items
        };
    }

    Services.ApiFootballMapper = {
        mapFixture,
        mapFixtureList,
        mapCompetitions,
        mapStatus
    };
})();
