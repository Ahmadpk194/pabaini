import { Global, Module } from '@nestjs/common';
import { FirebaseAdminService } from './firebase.service';

@Global()
@Module({
  providers: [FirebaseAdminService],
  exports: [FirebaseAdminService],
})
export class FirebaseModule {}
