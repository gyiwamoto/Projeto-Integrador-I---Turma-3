export const whatsappTemplates = {
  confirmacaoAgendamento: (paciente: string, data: string, horario: string) => 
    `Olá, *${paciente}*! Sua consulta foi agendada com sucesso para o dia *${data}* às *${horario}*. Ficamos felizes em atendê-lo!`,

  lembreteConsulta: (paciente: string, data: string, horario: string) => 
    `Oi, *${paciente}*! Passando para lembrar da sua consulta amanhã, dia *${data}*, às *${horario}*. Podemos confirmar sua presença?`,

  posRealizacao: (paciente: string) => 
    `Olá, *${paciente}*! Agradecemos a confiança em nosso atendimento hoje. Esperamos que tenha tido uma excelente experiência!`
};
