import { Transform } from 'class-transformer';
import * as sanitizeHtml from 'sanitize-html';

export function Sanitize() {
    return Transform(({ value }) => {
        if (typeof value === 'string') {
            return sanitizeHtml(value, {
                allowedTags: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
                allowedAttributes: {
                    'a': ['href']
                }
            });
        }
        return value;
    });
}
