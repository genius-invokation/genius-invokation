import { createSignal } from "solid-js";
import { GITHUB_AUTH_REDIRECT_URL } from "../config";
import { useAuth } from "../auth";

export function Login() {
  const CLIENT_ID = "Iv23liMGX6EkkrfUax8B";
  const REDIRECT_URL = encodeURIComponent(GITHUB_AUTH_REDIRECT_URL);
  const { loginGuest } = useAuth();

  const showGuestHint = () => {
    window.alert(`在游客模式下：
- 您的牌组将保存在本地，不会在云端同步；
- 您的对局记录将不会在任何地方保存。

如果您希望将对局中的 bug 反馈给开发者，那么强烈建议您使用 GitHub 登录以便我们在数据库中查询对局记录。`);
  };

  const [guestNameValid, setGuestNameValid] = createSignal(false);

  const guestLogin = async (e: SubmitEvent) => {
    e.preventDefault();
    const form = new FormData(e.target as HTMLFormElement);
    const name = form.get("guestName") as string;
    loginGuest(name);
  };

  return (
    <div class="w-80 flex flex-col items-stretch text-xl my-8 gap-10">
      <a
        href={`https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URL}`}
        class="flex flex-row gap-2 btn btn-solid-black text-1em py-0.8em"
      >
        <i class="block i-mdi-github" />
        <span>推荐使用 GitHub 登录</span>
      </a>
      <hr />
      <div class="flex flex-col gap-1">
        <p class="text-gray-500 text-sm">
          或者以{" "}
          <span class="text-blue-400 cursor-pointer" onClick={showGuestHint}>
            游客身份
          </span>{" "}
          继续……
        </p>
        <form class="flex flex-row" onSubmit={guestLogin}>
          <input
            class="input input-solid rounded-r-0 b-r-0"
            name="guestName"
            maxLength={64}
            placeholder="起一个响亮的名字吧！"
            pattern=".*[^\s].*"
            onInput={(e) => setGuestNameValid(e.target.checkValidity())}
            autofocus
            required
          />
          <button
            type="submit"
            class="flex-shrink-0 btn btn-solid rounded-l-0"
            disabled={!guestNameValid()}
          >
            <span>确认</span>
          </button>
        </form>
      </div>
    </div>
  );
}
