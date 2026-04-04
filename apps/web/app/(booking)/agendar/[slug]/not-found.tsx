import Link from 'next/link'

export default function BookingNotFound() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center">
            <svg
              className="h-5 w-5 text-zinc-950"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243zm0-5.758a3 3 0 10-4.243-4.243"
              />
            </svg>
          </div>
          <span className="font-bold text-zinc-300">BarberPro</span>
        </div>

        {/* Ícone */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              className="h-8 w-8 text-zinc-500"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 10.5L21 3m0 0h-5.25M21 3v5.25M10.5 13.5L3 21m0 0h5.25M3 21v-5.25"
              />
            </svg>
          </div>
        </div>

        <h1 className="text-xl font-bold text-zinc-100 mb-2">
          Barbearia não encontrada
        </h1>
        <p className="text-sm text-zinc-400 mb-8 leading-relaxed">
          O link de agendamento que você acessou não existe ou esta barbearia
          não está mais ativa. Verifique se o endereço está correto.
        </p>

        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 w-full border border-zinc-700 hover:border-zinc-600 text-zinc-400 hover:text-zinc-200 font-medium px-6 py-3 rounded-xl transition-colors text-sm"
        >
          Ir para o início
        </Link>
      </div>
    </div>
  )
}
