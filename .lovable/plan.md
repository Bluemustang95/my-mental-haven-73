## Plan: Fix Bottom Button Covered by BottomNav

### Problem
The fixed action button at the bottom of the "Resumen para mi Psico" flow is visually and functionally covered by the `BottomNav` component (z-50 inline style), preventing the user from tapping it.

### Root Cause
- `ResumenPsico.tsx`: the "Generar resumen" button wrapper is `fixed inset-x-0 bottom-0 z-40`.
- `ReportEditor.tsx`: the "Enviar al profesional" button wrapper is also `fixed inset-x-0 bottom-0 z-40`.
- `BottomNav.tsx`: the nav pill has `zIndex: 50` inline style.

`z-40 < 50`, so the nav renders above the action buttons.

### Fix Steps

1. **Raise z-index of fixed action bars**
   - `ResumenPsico.tsx`: change `z-40` to `z-[60]` on the fixed bottom button wrapper.
   - `ReportEditor.tsx`: change `z-40` to `z-[60]` on the fixed bottom button wrapper.

2. **Add vertical clearance above the BottomNav pill**
   - `ResumenPsico.tsx`: increase the scrollable container bottom padding from `pb-24` to `pb-32` (or equivalent `pb-28`) so the last accordion does not hide behind the button.
   - `ReportEditor.tsx`: increase `pb-32` to `pb-40` so the textarea does not scroll behind the fixed button + BottomNav combined height.

3. **Verify**
   - Build compiles without errors.
   - Visual check on mobile preview confirms the "Generar resumen" and "Enviar al profesional" buttons are fully tappable and sit clearly above the BottomNav pill.

### No schema or dependency changes required.
