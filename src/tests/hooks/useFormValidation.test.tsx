import { renderHook, act } from '@testing-library/react';
import { useFormValidation } from '@/hooks/useFormValidation';
import { z } from 'zod';

const testSchema = z.object({
  email: z.string().email('Invalid email'),
  name: z.string().min(3, 'Name too short'),
});

describe('useFormValidation', () => {
  it('validates form data', async () => {
    const { result } = renderHook(() => useFormValidation(testSchema));

    act(() => {
      result.current.setValue('email', 'invalid');
      result.current.setValue('name', 'ab');
    });

    let isValid = true;
    await act(async () => {
      isValid = await result.current.trigger();
    });

    expect(isValid).toBe(false);
  });

  it('clears errors on valid input', async () => {
    const { result } = renderHook(() =>
      useFormValidation(testSchema, {
        email: 'test@example.com',
        name: 'John Doe',
      })
    );

    let isValid = false;
    await act(async () => {
      isValid = await result.current.trigger();
    });

    expect(isValid).toBe(true);
    expect(Object.keys(result.current.formState.errors)).toHaveLength(0);
  });
});
