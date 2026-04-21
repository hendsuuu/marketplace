import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { login } from '@/routes';
import { store } from '@/routes/register';

export default function Register() {
    return (
        <>
            <Head title="Register" />
            <Form
                {...store.form()}
                resetOnSuccess={['password', 'password_confirmation']}
                disableWhileProcessing
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Nama Lengkap</Label>
                                <Input id="name" type="text" required autoFocus tabIndex={1} autoComplete="name" name="name" placeholder="Nama lengkap Anda" />
                                <InputError message={errors.name} className="mt-2" />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">Alamat Email</Label>
                                <Input id="email" type="email" required tabIndex={2} autoComplete="email" name="email" placeholder="email@contoh.com" />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2 md:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="phone">No. Telepon</Label>
                                    <Input id="phone" tabIndex={3} autoComplete="tel" name="phone" placeholder="08xxxxxxxxxx" />
                                    <InputError message={errors.phone} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="instagram">Instagram</Label>
                                    <Input id="instagram" tabIndex={4} name="instagram" placeholder="@username" />
                                    <InputError message={errors.instagram} />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="address">Alamat</Label>
                                <textarea id="address" name="address" tabIndex={5} rows={3} className="textarea-field" placeholder="Alamat lengkap untuk kebutuhan pengiriman dan pengembalian" />
                                <InputError message={errors.address} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="birth_date">Tanggal Lahir</Label>
                                <Input id="birth_date" type="date" tabIndex={6} name="birth_date" />
                                <InputError message={errors.birth_date} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password">Password</Label>
                                <PasswordInput id="password" required tabIndex={7} autoComplete="new-password" name="password" placeholder="Password" />
                                <InputError message={errors.password} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password_confirmation">Konfirmasi Password</Label>
                                <PasswordInput id="password_confirmation" required tabIndex={8} autoComplete="new-password" name="password_confirmation" placeholder="Konfirmasi password" />
                                <InputError message={errors.password_confirmation} />
                            </div>

                            <p className="rounded-lg border border-border bg-secondary/40 px-4 py-3 text-xs leading-5 text-[#6a5140]">
                                Upload kartu identitas dapat dilakukan setelah akun aktif melalui halaman profile customer.
                            </p>

                            <Button type="submit" className="mt-2 w-full" tabIndex={9} data-test="register-user-button">
                                {processing && <Spinner />}
                                Buat Akun
                            </Button>
                        </div>

                        <div className="text-center text-sm text-muted-foreground">
                            Sudah punya akun?{' '}
                            <TextLink href={login()} tabIndex={10}>
                                Masuk
                            </TextLink>
                        </div>
                    </>
                )}
            </Form>
        </>
    );
}

Register.layout = {
    title: 'Buat akun baru',
    description: 'Daftarkan diri Anda untuk mulai menyewa fashion pilihan.',
};
