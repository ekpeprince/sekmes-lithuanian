export async function shareBattleInvite(userName?: string): Promise<{ shared: boolean; copied: boolean }> {
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/league?battle=invite` : '';
  const shareData = {
    title: 'LabasApp 1v1 Dvikova 🇱🇹⚔️',
    text: `${userName || 'Tavo draugas'} kviečia tave į 1v1 lietuvių kalbos žodžių dvikovą LabasApp! Ar pavyks mane nugalėti?`,
    url: shareUrl,
  };

  if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare && navigator.canShare(shareData)) {
    try {
      await navigator.share(shareData);
      return { shared: true, copied: false };
    } catch (err: unknown) {
      if ((err as DOMException)?.name === 'AbortError') return { shared: false, copied: false };
    }
  }

  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    await navigator.clipboard.writeText(shareUrl);
    return { shared: false, copied: true };
  }

  return { shared: false, copied: false };
}
