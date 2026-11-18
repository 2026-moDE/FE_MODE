import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import KakaoSDKAuth
import KakaoSDKCommon
import NMapsMap
import FirebaseCore
import GoogleSignIn

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    FirebaseApp.configure()

    if let kakaoAppKey = Bundle.main.object(forInfoDictionaryKey: "KAKAO_APP_KEY") as? String {
      KakaoSDK.initSDK(appKey: kakaoAppKey)
    }

    // 안드로이드(build.gradle의 resValue)와 맞춰서 키를 소스에 두지 않는다.
    // 값은 ios/Config.xcconfig(gitignore) → Info.plist 치환으로 들어온다
    if let nmfClientId = Bundle.main.object(forInfoDictionaryKey: "NMF_CLIENT_ID") as? String,
       !nmfClientId.isEmpty {
      NMFAuthManager.shared().ncpKeyId = nmfClientId
    }

    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    window = UIWindow(frame: UIScreen.main.bounds)

    factory.startReactNative(
      withModuleName: "moing",
      in: window,
      launchOptions: launchOptions
    )

    // 런치스크린이 내려간 뒤 JS가 첫 화면을 그리기 전까지는 RN 루트 뷰가 그대로 보인다.
    // 색을 안 정하면 기본 검정이라 런치스크린(#111114) → 검정 → 스플래시로 한 번 튄다.
    // LaunchScreen.storyboard / BrandSplash.tsx와 같은 colors.background.dark 값으로 맞춘다
    window?.backgroundColor = Self.brandBackground
    window?.rootViewController?.view.backgroundColor = Self.brandBackground

    // 그 구간엔 배경색만 있고 로고가 없어서 로고가 깜빡 사라졌다 돌아온다.
    // 런치스크린과 같은 그림을 덮어두고, JS 첫 화면이 올라오면 걷어낸다
    showLaunchOverlay()

    return true
  }

  // LaunchScreen.storyboard / BrandSplash.tsx와 같은 값 (colors.background.dark, colors.brand.primary)
  private static let brandBackground = UIColor(red: 17.0 / 255.0, green: 17.0 / 255.0, blue: 20.0 / 255.0, alpha: 1.0)
  private static let brandLogoTint = UIColor(red: 1.0, green: 253.0 / 255.0, blue: 109.0 / 255.0, alpha: 1.0)

  // 평소엔 쓰이지 않는 안전망. RCTContentDidAppearNotification이 먼저 걷어내는 걸 실기기에서 확인했고,
  // 이 값은 알림이 유실되는 예외 상황에서도 화면이 영영 가려지지 않게 하는 상한이다
  private static let launchOverlayTimeout: TimeInterval = 5.0

  private var launchOverlay: UIView?

  // 런치스크린과 똑같은 그림(배경 + 가운데 로고 120x75)을 RN 루트 뷰 위에 덮는다
  private func showLaunchOverlay() {
    guard let rootView = window?.rootViewController?.view else { return }

    let overlay = UIView(frame: rootView.bounds)
    overlay.backgroundColor = Self.brandBackground
    overlay.autoresizingMask = [.flexibleWidth, .flexibleHeight]

    // 흰 로고를 템플릿으로 렌더해 틴트 - 에셋 카탈로그의 launch_logo를 런치스크린과 공유한다
    let logo = UIImageView(image: UIImage(named: "launch_logo")?.withRenderingMode(.alwaysTemplate))
    logo.tintColor = Self.brandLogoTint
    logo.contentMode = .scaleAspectFit
    logo.translatesAutoresizingMaskIntoConstraints = false
    overlay.addSubview(logo)

    NSLayoutConstraint.activate([
      logo.centerXAnchor.constraint(equalTo: overlay.centerXAnchor),
      logo.centerYAnchor.constraint(equalTo: overlay.centerYAnchor),
      logo.widthAnchor.constraint(equalToConstant: 120),
      logo.heightAnchor.constraint(equalToConstant: 75),
    ])

    rootView.addSubview(overlay)
    launchOverlay = overlay

    NotificationCenter.default.addObserver(
      self,
      selector: #selector(hideLaunchOverlay),
      name: NSNotification.Name("RCTContentDidAppearNotification"),
      object: nil
    )

    DispatchQueue.main.asyncAfter(deadline: .now() + Self.launchOverlayTimeout) { [weak self] in
      self?.hideLaunchOverlay()
    }
  }

  @objc private func hideLaunchOverlay() {
    // 알림과 타임아웃 양쪽에서 불릴 수 있으므로 먼저 들어온 쪽만 처리한다
    guard let overlay = launchOverlay else { return }

    launchOverlay = nil
    NotificationCenter.default.removeObserver(
      self,
      name: NSNotification.Name("RCTContentDidAppearNotification"),
      object: nil
    )
    overlay.removeFromSuperview()
  }

  func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
    if AuthApi.isKakaoTalkLoginUrl(url) {
      return AuthController.handleOpenUrl(url: url)
    }
    if GIDSignIn.sharedInstance.handle(url) {
      return true
    }
    return false
  }

}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
