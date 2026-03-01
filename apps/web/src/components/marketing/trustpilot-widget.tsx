/* eslint-disable @next/next/no-img-element */

const TRUSTPILOT_URL = "https://nl.trustpilot.com/review/openhospi.nl";

const VALID_SCORES = [0, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5] as const;
type TrustpilotScore = (typeof VALID_SCORES)[number];

function nearestScore(score: number): TrustpilotScore {
    return VALID_SCORES.reduce((prev, curr) =>
        Math.abs(curr - score) < Math.abs(prev - score) ? curr : prev,
    );
}

export function TrustpilotWidget({score = 0}: { score?: number }) {
    const rounded = nearestScore(score);

    return (
        <a
            href={TRUSTPILOT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2 transition-opacity hover:opacity-80"
        >
            <img
                src={`/trustpilot/stars-${rounded}.svg`}
                alt={`Trustpilot ${rounded} out of 5`}
                width={108}
                height={20}
            />
            <img
                src="/trustpilot/logo-black.svg"
                alt="Trustpilot"
                width={80}
                height={20}
                className="dark:invert"
            />
        </a>
    );
}
