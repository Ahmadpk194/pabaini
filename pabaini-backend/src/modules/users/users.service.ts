import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { getSupabaseClient } from '../../config/supabase.config';
import { User } from './entities/user.entity';
import { CricketPlayersService } from '../sports/cricket/players/cricket-players.service';
import { TeamsService } from '../sports/cricket/teams/teams.service';
import { CricketStatsService } from '../sports/cricket/stats/cricket-stats.service';

@Injectable()
export class UsersService {
    private readonly logger = new Logger(UsersService.name);

    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        private readonly cricketPlayersService: CricketPlayersService,
        private readonly teamsService: TeamsService,
        private readonly cricketStatsService: CricketStatsService,
    ) { }

    // find user by firebase uid
    // if not found create new one (first login = register)
    async findOrCreate(firebaseUser: {
        firebase_uid: string;
        phone?: string | null;
        email?: string | null;
        name?: string | null;
        avatar_url?: string | null;
    }): Promise<User> {

        let user = await this.usersRepository.findOne({
            where: { firebase_uid: firebaseUser.firebase_uid },
        });

        if (user) return user;

        if (firebaseUser.email) {
            const existingEmailUser = await this.usersRepository.findOne({
                where: { email: firebaseUser.email },
            });
            if (existingEmailUser) {
                throw new BadRequestException(
                    'This email address is already associated with an existing account. Please log in using that account\'s primary method.',
                );
            }
        }

        if (firebaseUser.phone) {
            const existingPhoneUser = await this.usersRepository.findOne({
                where: { phone: firebaseUser.phone },
            });
            if (existingPhoneUser) {
                throw new BadRequestException(
                    'This phone number is already associated with an existing account. Please log in using that account\'s primary method.',
                );
            }
        }

        const newUser = this.usersRepository.create({
            firebase_uid: firebaseUser.firebase_uid,
            phone: firebaseUser.phone ?? undefined,
            email: firebaseUser.email ?? undefined,
            name: firebaseUser.name ?? undefined,
            avatar_url: firebaseUser.avatar_url ?? undefined,
        });

        user = await this.usersRepository.save(newUser);

        return user;
    }

    async findById(id: number): Promise<User> {
        const user = await this.usersRepository.findOne({
            where: { id },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return user;
    }

    async findByFirebaseUid(firebase_uid: string): Promise<User> {
        const user = await this.usersRepository.findOne({
            where: { firebase_uid },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return user;
    }

    async updateUser(id: number, updateUserDto: UpdateUserDto): Promise<User> {
        if (updateUserDto.email) {
            const existing = await this.usersRepository.findOne({ where: { email: updateUserDto.email } });
            if (existing && existing.id !== id) {
                throw new BadRequestException('Email address is already in use by another account');
            }
        }
        if (updateUserDto.phone) {
            const existing = await this.usersRepository.findOne({ where: { phone: updateUserDto.phone } });
            if (existing && existing.id !== id) {
                throw new BadRequestException('Phone number is already in use by another account');
            }
        }

        await this.usersRepository.update(id, updateUserDto);

        return this.findById(id);
    }

    async updateUserByFirebaseUid(firebase_uid: string, updateUserDto: UpdateUserDto): Promise<User> {
        const user = await this.findByFirebaseUid(firebase_uid);
        if (updateUserDto.email) {
            const existing = await this.usersRepository.findOne({ where: { email: updateUserDto.email } });
            if (existing && existing.id !== user.id) {
                throw new BadRequestException('Email address is already in use by another account');
            }
        }
        if (updateUserDto.phone) {
            const existing = await this.usersRepository.findOne({ where: { phone: updateUserDto.phone } });
            if (existing && existing.id !== user.id) {
                throw new BadRequestException('Phone number is already in use by another account');
            }
        }

        await this.usersRepository.update(user.id, updateUserDto);

        return this.findByFirebaseUid(firebase_uid);
    }

    async uploadAvatar(firebase_uid: string, file: any): Promise<User> {
        // Ensure user exists first before uploading to storage
        const user = await this.findByFirebaseUid(firebase_uid);

        const fileExt = file.originalname.split('.').pop();
        const fileName = `${firebase_uid}-${Date.now()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        const supabase = getSupabaseClient();
        const { data, error } = await supabase.storage
            .from('pabaini-media')
            .upload(filePath, file.buffer, {
                contentType: file.mimetype,
                upsert: true,
            });

        if (error) {
            throw new Error(`Failed to upload avatar to Supabase: ${error.message}`);
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('pabaini-media')
            .getPublicUrl(filePath);

        user.avatar_url = publicUrl;
        return this.usersRepository.save(user);
    }

    async updateUserRole(id: number, dto: UpdateUserRoleDto): Promise<User> {
        await this.usersRepository.update(id, { role: dto.role });
        return this.findById(id);
    }

    async registerDeviceToken(userId: number, token: string): Promise<{ success: boolean }> {
        const user = await this.findById(userId);
        
        if (!user.device_tokens) {
            user.device_tokens = [];
        }
        
        if (!user.device_tokens.includes(token)) {
            user.device_tokens.push(token);
            await this.usersRepository.save(user);
        }
        
        return { success: true };
    }

    async removeDeviceToken(userId: number, token: string): Promise<{ success: boolean }> {
        const user = await this.findById(userId);
        
        if (!user.device_tokens || !user.device_tokens.includes(token)) {
            throw new BadRequestException('Device token not found for this user');
        }
        
        user.device_tokens = user.device_tokens.filter(t => t !== token);
        await this.usersRepository.save(user);
        
        return { success: true };
    }

    async getPublicProfile(userId: number) {
        const user = await this.usersRepository.findOne({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                avatar_url: true,
                village: true,
                is_diaspora: true,
                role: true,
                created_at: true,
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        let cricket: any = null;

        try {
            const cricketProfile = await this.cricketPlayersService.findByUserIdOrNull(userId);

            if (cricketProfile) {
                const [currentTeams, pastTeams, stats] = await Promise.all([
                    this.teamsService.getActiveTeamsForPlayer(cricketProfile.id),
                    this.teamsService.getPastTeamsForPlayer(cricketProfile.id),
                    this.cricketStatsService.getStatsForPlayer(cricketProfile.id),
                ]);

                cricket = {
                    player_profile: cricketProfile,
                    stats,
                    current_teams: currentTeams,
                    past_teams: pastTeams,
                    trophies: [],
                };
            }
        } catch (error: any) {
            this.logger.warn(`Failed to load cricket profile data for user ${userId}: ${error.message}`);
            cricket = null;
        }

        return { user, cricket };
    }
}
