import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { parseRichDocument } from './rich-document';

/** Guards run before DTO transformation, which recursively traverses unknown JSON. */
@Injectable()
export class RichDocumentGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const body: unknown = context.switchToHttp().getRequest().body;
    if (
      typeof body === 'object' &&
      body !== null &&
      'contentDocument' in body
    ) {
      parseRichDocument(body.contentDocument);
    }
    return true;
  }
}
