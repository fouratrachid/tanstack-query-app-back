import { IsString, IsNotEmpty } from 'class-validator';
import { Sanitize } from '../../common/decorators/sanitize.decorator';

export class CreateCommentDto {
    @IsString()
    @IsNotEmpty()
    @Sanitize()
    content: string;
}
