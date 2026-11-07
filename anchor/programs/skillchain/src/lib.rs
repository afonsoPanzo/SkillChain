// PLACEHOLDER — reference copy of the on-chain program.
//
// The real program was compiled and deployed to Devnet through Solana Playground
// (beta.solpg.io). Replace this file with the final source for reference only.
// Do NOT run `anchor build` or `anchor deploy` from this repository.
use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};

// O Solana Playground substitui este ID automaticamente no primeiro build.
declare_id!("AqdB1HaXB8wnvwGFTNsxTRrpSNMMVs2x5t4bz6UxU2X7");

// ---------- Constantes (iguais em src/lib/skillchain/constants.ts) ----------
pub const POINTS_LEVEL_1: u64 = 100;
pub const POINTS_LEVEL_2: u64 = 150;
pub const POINTS_LEVEL_3: u64 = 200;
pub const TRANSFER_LAMPORTS: u64 = 10_000_000; // 0,01 SOL
pub const NONE: u8 = 255;
pub const MAX_MESSAGE_LEN: usize = 100;

pub const CATEGORY_FRAME: u8 = 0;
pub const CATEGORY_ACCESSORY: u8 = 1;
pub const CATEGORY_TITLE: u8 = 2;

// (categoria, preço, nível mínimo) — o índice é o item_id
pub const ITEMS: [(u8, u64, u8); 4] = [
    (CATEGORY_FRAME, 100, 1),     // 0 Moldura Devnet
    (CATEGORY_FRAME, 250, 3),     // 1 Moldura Validador
    (CATEGORY_ACCESSORY, 150, 2), // 2 Óculos Turbo
    (CATEGORY_TITLE, 200, 3),     // 3 Mestre das PDAs
];

#[program]
pub mod skillchain {
    use super::*;

    /// Nível 1: criar o perfil prova que o jogador tem SOL de teste e sabe assinar.
    pub fn init_profile(ctx: Context<InitProfile>) -> Result<()> {
        let profile = &mut ctx.accounts.profile;
        profile.owner = ctx.accounts.player.key();
        profile.level = 1;
        profile.points = POINTS_LEVEL_1;
        profile.total_earned = POINTS_LEVEL_1;
        profile.items = 0;
        profile.equipped_frame = NONE;
        profile.equipped_accessory = NONE;
        profile.equipped_title = NONE;
        profile.bump = ctx.bumps.profile;

        emit!(LevelCompleted {
            player: profile.owner,
            level: 1,
            points: POINTS_LEVEL_1,
        });
        Ok(())
    }

    /// Nível 2: a transferência de 0,01 SOL acontece dentro desta instrução.
    pub fn complete_level_2(ctx: Context<CompleteLevel2>) -> Result<()> {
        require!(ctx.accounts.profile.level == 1, SkillChainError::WrongLevel);
        require_keys_neq!(
            ctx.accounts.recipient.key(),
            ctx.accounts.player.key(),
            SkillChainError::InvalidRecipient
        );

        transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.player.to_account_info(),
                    to: ctx.accounts.recipient.to_account_info(),
                },
            ),
            TRANSFER_LAMPORTS,
        )?;

        award(&mut ctx.accounts.profile, 2, POINTS_LEVEL_2)?;
        emit!(LevelCompleted {
            player: ctx.accounts.player.key(),
            level: 2,
            points: POINTS_LEVEL_2,
        });
        Ok(())
    }

    /// Nível 3: criar uma conta PDA própria (a nota).
    pub fn complete_level_3(ctx: Context<CompleteLevel3>, message: String) -> Result<()> {
        require!(ctx.accounts.profile.level == 2, SkillChainError::WrongLevel);
        require!(
            !message.is_empty() && message.len() <= MAX_MESSAGE_LEN,
            SkillChainError::MessageTooLong
        );

        let note = &mut ctx.accounts.note;
        note.owner = ctx.accounts.player.key();
        note.message = message;
        note.created_at = Clock::get()?.unix_timestamp;
        note.bump = ctx.bumps.note;

        award(&mut ctx.accounts.profile, 3, POINTS_LEVEL_3)?;
        emit!(LevelCompleted {
            player: ctx.accounts.player.key(),
            level: 3,
            points: POINTS_LEVEL_3,
        });
        Ok(())
    }

    pub fn buy_item(ctx: Context<ModifyProfile>, item_id: u8) -> Result<()> {
        let (_, price, min_level) = get_item(item_id)?;
        let profile = &mut ctx.accounts.profile;
        let mask = 1u8 << item_id;

        require!(profile.items & mask == 0, SkillChainError::AlreadyOwned);
        require!(profile.level >= min_level, SkillChainError::LevelTooLow);
        require!(profile.points >= price, SkillChainError::NotEnoughPoints);

        profile.points = profile
            .points
            .checked_sub(price)
            .ok_or(SkillChainError::NotEnoughPoints)?;
        profile.items |= mask;

        emit!(ItemBought {
            player: profile.owner,
            item_id,
        });
        Ok(())
    }

    pub fn equip_item(ctx: Context<ModifyProfile>, item_id: u8) -> Result<()> {
        let (category, _, _) = get_item(item_id)?;
        let profile = &mut ctx.accounts.profile;
        require!(profile.items & (1u8 << item_id) != 0, SkillChainError::NotOwned);

        match category {
            CATEGORY_FRAME => profile.equipped_frame = item_id,
            CATEGORY_ACCESSORY => profile.equipped_accessory = item_id,
            _ => profile.equipped_title = item_id,
        }
        Ok(())
    }

    /// slot: 0 = moldura, 1 = acessório, 2 = título
    pub fn unequip_item(ctx: Context<ModifyProfile>, slot: u8) -> Result<()> {
        let profile = &mut ctx.accounts.profile;
        match slot {
            CATEGORY_FRAME => profile.equipped_frame = NONE,
            CATEGORY_ACCESSORY => profile.equipped_accessory = NONE,
            CATEGORY_TITLE => profile.equipped_title = NONE,
            _ => return err!(SkillChainError::InvalidSlot),
        }
        Ok(())
    }
}

// ---------- Auxiliares ----------
fn get_item(item_id: u8) -> Result<(u8, u64, u8)> {
    ITEMS
        .get(item_id as usize)
        .copied()
        .ok_or_else(|| error!(SkillChainError::UnknownItem))
}

fn award(profile: &mut Profile, level: u8, points: u64) -> Result<()> {
    profile.level = level;
    profile.points = profile
        .points
        .checked_add(points)
        .ok_or(SkillChainError::Overflow)?;
    profile.total_earned = profile
        .total_earned
        .checked_add(points)
        .ok_or(SkillChainError::Overflow)?;
    Ok(())
}

// ---------- Contas ----------
#[account]
#[derive(InitSpace)]
pub struct Profile {
    pub owner: Pubkey,
    pub level: u8,
    pub points: u64,
    pub total_earned: u64,
    pub items: u8,
    pub equipped_frame: u8,
    pub equipped_accessory: u8,
    pub equipped_title: u8,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Note {
    pub owner: Pubkey,
    #[max_len(100)]
    pub message: String,
    pub created_at: i64,
    pub bump: u8,
}

// ---------- Contextos ----------
#[derive(Accounts)]
pub struct InitProfile<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
    #[account(
        init,
        payer = player,
        space = 8 + Profile::INIT_SPACE,
        seeds = [b"profile", player.key().as_ref()],
        bump
    )]
    pub profile: Account<'info, Profile>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CompleteLevel2<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
    #[account(
        mut,
        seeds = [b"profile", player.key().as_ref()],
        bump = profile.bump,
        constraint = profile.owner == player.key() @ SkillChainError::Unauthorized
    )]
    pub profile: Account<'info, Profile>,
    #[account(mut)]
    pub recipient: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CompleteLevel3<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
    #[account(
        mut,
        seeds = [b"profile", player.key().as_ref()],
        bump = profile.bump,
        constraint = profile.owner == player.key() @ SkillChainError::Unauthorized
    )]
    pub profile: Account<'info, Profile>,
    #[account(
        init,
        payer = player,
        space = 8 + Note::INIT_SPACE,
        seeds = [b"note", player.key().as_ref()],
        bump
    )]
    pub note: Account<'info, Note>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ModifyProfile<'info> {
    pub player: Signer<'info>,
    #[account(
        mut,
        seeds = [b"profile", player.key().as_ref()],
        bump = profile.bump,
        constraint = profile.owner == player.key() @ SkillChainError::Unauthorized
    )]
    pub profile: Account<'info, Profile>,
}

// ---------- Eventos ----------
#[event]
pub struct LevelCompleted {
    pub player: Pubkey,
    pub level: u8,
    pub points: u64,
}

#[event]
pub struct ItemBought {
    pub player: Pubkey,
    pub item_id: u8,
}

// ---------- Erros ----------
#[error_code]
pub enum SkillChainError {
    #[msg("O nível anterior ainda não foi concluído.")]
    WrongLevel,
    #[msg("O destinatário não pode ser a tua própria carteira.")]
    InvalidRecipient,
    #[msg("A mensagem tem de ter entre 1 e 100 caracteres.")]
    MessageTooLong,
    #[msg("Este item não existe.")]
    UnknownItem,
    #[msg("Já tens este item.")]
    AlreadyOwned,
    #[msg("Precisas de um nível mais alto para este item.")]
    LevelTooLow,
    #[msg("Não tens pontos suficientes.")]
    NotEnoughPoints,
    #[msg("Ainda não tens este item.")]
    NotOwned,
    #[msg("Este perfil não te pertence.")]
    Unauthorized,
    #[msg("Espaço de equipamento inválido.")]
    InvalidSlot,
    #[msg("Erro de cálculo de pontos.")]
    Overflow,
}