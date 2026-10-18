import { Button } from "../../../components/Button/Button"

export const LoginForm = () => {
    return (
        <form className="flex flex-col gap-4">
      {/* Các ô Input ở đây... */}

      <Button type="submit" isLoading={false}>
        Đăng nhập
      </Button>

      <Button type="button" variant="outline">
        Đăng ký
      </Button>
            
      <Button type="button" variant="outline" size="sm">
        Quên mật khẩu?
      </Button>
    </form>
    )
}