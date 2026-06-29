import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Delete, UseGuards, UseInterceptors, UploadedFile, BadRequestException, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FirebaseAuthGuard } from 'src/common/guards/firebase-auth.guard';
import { DbUserGuard } from 'src/common/guards/db-user.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { DbUser } from 'src/common/decorators/db-user.decorator';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UserRole } from './entities/user.entity';
import { QueryUsersDto } from './dto/query-users.dto';

@Controller('users')
export class UserController {
    constructor(private usersService: UsersService) { }

    @Get()
    @UseGuards(FirebaseAuthGuard, DbUserGuard)
    async getAllUsers(@Query() query: QueryUsersDto) {
        const result = await this.usersService.getAllUsers(query);
        return { data: result, message: 'Users directory retrieved successfully' };
    }

    @Get('me')
    @UseGuards(FirebaseAuthGuard, DbUserGuard)
    async getMe(@DbUser() user: any) {
        return user;
    }

    @Patch('me')
    @UseGuards(FirebaseAuthGuard, DbUserGuard)
    async updateMe(@DbUser() user: any, @Body() dto: UpdateUserDto) {
        return this.usersService.updateUser(user.id, dto);
    }

    @Post('me/avatar')
    @UseGuards(FirebaseAuthGuard, DbUserGuard)
    @UseInterceptors(FileInterceptor('avatar'))
    async uploadAvatar(
        @DbUser() user: any,
        @UploadedFile() file: any,
    ) {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }
        return this.usersService.uploadAvatar(user.firebase_uid, file);
    }

    // Admin-only: assign a role to any user
    @Patch(':id/role')
    @UseGuards(FirebaseAuthGuard, DbUserGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    async updateRole(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateUserRoleDto,
    ) {
        return this.usersService.updateUserRole(id, dto);
    }

    @Post('device-token')
    @UseGuards(FirebaseAuthGuard, DbUserGuard)
    // Register device token for push notifications
    async registerDeviceToken(
        @DbUser() user: any,
        @Body('token') token: string,
    ) {
        return this.usersService.registerDeviceToken(user.id, token);
    }

    @Delete('device-token')
    @UseGuards(FirebaseAuthGuard, DbUserGuard)
    // Remove device token for push notifications
    async removeDeviceToken(
        @DbUser() user: any,
        @Body('token') token: string,
    ) {
        return this.usersService.removeDeviceToken(user.id, token);
    }

    @Get(':id/profile')
    async getPublicProfile(@Param('id', ParseIntPipe) id: number) {
        return this.usersService.getPublicProfile(id);
    }
}
