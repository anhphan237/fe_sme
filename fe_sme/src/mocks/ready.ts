const startMsw = async () => {
  try {
    const { worker } = await import('./browser')
    await worker.start({
      onUnhandledRequest: 'bypass',
    })
    return true
  } catch (error) {
    console.warn('MSW failed to start', error)
    return false
  }
}

const mswTimeout = new Promise<boolean>((resolve) => {
  setTimeout(() => resolve(false), 1500)
})

export const mswReady = import.meta.env.DEV
  ? Promise.race([startMsw(), mswTimeout])
  : Promise.resolve(true)
