/**
 * NF-e via Focus NFe API
 * Docs: https://focusnfe.com.br/doc/
 *
 * Variável de ambiente necessária:
 *   FOCUS_NFE_TOKEN=seu_token_aqui
 *   FOCUS_NFE_ENV=homologacao | producao (default: homologacao)
 */

const TOKEN = process.env.FOCUS_NFE_TOKEN
const ENV = (process.env.FOCUS_NFE_ENV ?? 'homologacao') as 'homologacao' | 'producao'
const BASE_URL = 'https://api.focusnfe.com.br'

export interface NFeParams {
  ref: string // referência única (ex: appointment id)
  naturezaOperacao: string
  dataEmissao: string // ISO date string
  cnpjEmitente: string
  ieEmitente: string
  razaoSocialEmitente: string
  municipioEmitente: string
  ufEmitente: string
  cepEmitente: string
  logradouroEmitente: string
  numeroEmitente: string
  cpfDestinatario?: string
  nomeDestinatario?: string
  indicadorIeDestinatario: 9 // 9 = não contribuinte
  itens: NFeItem[]
}

export interface NFeItem {
  numero: string
  codigo: string
  descricao: string
  ncm: string
  cfop: string
  unidade: string
  quantidade: number
  valorUnitario: number
  valorTotal: number
  aliquotaIcms?: number
  cst?: string
  pisAliquota?: number
  cofinsAliquota?: number
}

export async function emitirNFe(params: NFeParams): Promise<{ ref: string; status: string; url?: string }> {
  if (!TOKEN) throw new Error('Focus NFe não configurado (FOCUS_NFE_TOKEN ausente)')

  const body = {
    natureza_operacao: params.naturezaOperacao,
    data_emissao: params.dataEmissao,
    tipo_documento: 1,
    finalidade_emissao: 1,
    consumidor_final: 1,
    presenca_comprador: 1,
    modalidade_frete: 9,
    emitente: {
      cnpj: params.cnpjEmitente,
      inscricao_estadual: params.ieEmitente,
      nome: params.razaoSocialEmitente,
      municipio: params.municipioEmitente,
      uf: params.ufEmitente,
      cep: params.cepEmitente,
      logradouro: params.logradouroEmitente,
      numero: params.numeroEmitente,
      regime_tributario: 1, // Simples Nacional
    },
    destinatario: {
      cpf: params.cpfDestinatario ?? '',
      nome: params.nomeDestinatario ?? 'Consumidor Final',
      indicador_inscricao_estadual: params.indicadorIeDestinatario,
    },
    itens: params.itens.map((item, idx) => ({
      numero_item: item.numero ?? String(idx + 1),
      codigo_produto: item.codigo,
      descricao: item.descricao,
      ncm: item.ncm ?? '93040000',
      cfop: item.cfop ?? '5102',
      unidade_comercial: item.unidade ?? 'UN',
      quantidade_comercial: item.quantidade,
      valor_unitario_comercial: item.valorUnitario,
      valor_bruto: item.valorTotal,
      icms_origem: 0,
      icms_modalidade: 400,
    })),
  }

  const res = await fetch(`${BASE_URL}/v2/nfe?ref=${params.ref}&ambiente=${ENV}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`${TOKEN}:`).toString('base64')}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Focus NFe erro ${res.status}: ${err}`)
  }

  const data = await res.json()
  return {
    ref: params.ref,
    status: data.status as string,
    url: data.caminho_danfe as string | undefined,
  }
}

export async function consultarNFe(ref: string): Promise<{ status: string; url?: string; xml?: string }> {
  if (!TOKEN) throw new Error('Focus NFe não configurado')

  const res = await fetch(`${BASE_URL}/v2/nfe/${ref}?ambiente=${ENV}`, {
    headers: {
      Authorization: `Basic ${Buffer.from(`${TOKEN}:`).toString('base64')}`,
    },
  })

  if (!res.ok) throw new Error(`Erro ao consultar NF-e: ${res.statusText}`)
  const data = await res.json()
  return {
    status: data.status as string,
    url: data.caminho_danfe as string | undefined,
    xml: data.caminho_xml_nota_fiscal as string | undefined,
  }
}
