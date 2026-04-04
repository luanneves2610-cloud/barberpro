'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { Input } from '@barberpro/ui'
import { Button } from '@barberpro/ui'
import { Avatar } from '@barberpro/ui'
import { ImageUpload } from '@/components/ui/image-upload'
import { useToast } from '@/components/ui/toast'
import { updateProfile, updatePassword } from '@/lib/actions/profile'

interface Props {
  profile: {
    id: string
    name: string
    email: string
    phone: string
    role: string
    avatar_url?: string | null
  }
}

export function PerfilClient({ profile }: Props) {
  const { success, error } = useToast()
  const [isPendingProfile, startProfile] = useTransition()
  const [isPendingPassword, startPassword] = useTransition()
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? '')

  async function handleProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    fd.set('avatar_url', avatarUrl)

    startProfile(async () => {
      try {
        await updateProfile(fd)
        success('Dados atualizados com sucesso!')
      } catch (err) {
        error(err instanceof Error ? err.message : 'Erro ao salvar')
      }
    })
  }

  async function handlePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const newPassword = fd.get('new_password') as string
    const confirm = fd.get('confirm_password') as string

    if (newPassword !== confirm) {
      error('As senhas não coincidem')
      return
    }

    startPassword(async () => {
      try {
        await updatePassword(newPassword)
        success('Senha alterada com sucesso!')
        ;(e.target as HTMLFormElement).reset()
      } catch (err) {
        error(err instanceof Error ? err.message : 'Erro ao atualizar senha')
      }
    })
  }

  return (
    <div className="space-y-6 max-w-xl">
      {/* Dados pessoais */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        {/* Avatar preview header */}
        <div className="flex items-center gap-4 mb-6">
          {avatarUrl ? (
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full ring-2 ring-zinc-700">
              <Image src={avatarUrl} alt={profile.name} fill className="object-cover" unoptimized />
            </div>
          ) : (
            <Avatar name={profile.name} size="lg" />
          )}
          <div>
            <p className="text-base font-semibold text-zinc-100">{profile.name}</p>
            <p className="text-sm text-zinc-400">{profile.email}</p>
            <p className="text-xs text-zinc-500 mt-0.5 capitalize">{profile.role.toLowerCase()}</p>
          </div>
        </div>

        <form onSubmit={handleProfile} className="flex flex-col gap-4">
          <ImageUpload
            label="Foto de perfil"
            value={avatarUrl}
            onChange={setAvatarUrl}
            bucket="avatars"
            hint="JPG ou PNG quadrado, mín. 200×200px"
          />

          <Input
            label="Nome completo *"
            name="name"
            defaultValue={profile.name}
            placeholder="Seu nome"
            required
          />
          <Input
            label="Telefone"
            name="phone"
            type="tel"
            defaultValue={profile.phone}
            placeholder="(11) 99999-9999"
          />

          <div className="flex justify-end">
            <Button type="submit" loading={isPendingProfile}>
              Salvar dados
            </Button>
          </div>
        </form>
      </div>

      {/* Alterar senha */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="text-base font-semibold text-zinc-100 mb-1">Alterar Senha</h2>
        <p className="text-sm text-zinc-400 mb-5">Escolha uma senha forte com pelo menos 8 caracteres.</p>

        <form onSubmit={handlePassword} className="flex flex-col gap-4">
          <Input
            label="Nova senha *"
            name="new_password"
            type="password"
            placeholder="Mínimo 8 caracteres"
            minLength={8}
            required
          />
          <Input
            label="Confirmar nova senha *"
            name="confirm_password"
            type="password"
            placeholder="Repita a nova senha"
            required
          />

          <div className="flex justify-end">
            <Button type="submit" loading={isPendingPassword}>
              Alterar senha
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
