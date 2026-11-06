import AuthenticationServices
import UIKit

/**
 Phase C scaffold for an AutoFill Credential Provider extension.
 Wire this into an Xcode Credential Provider Extension target
 (`com.skyface.mypasswordvault.autofill`). See docs/autofill.md.
 */
class CredentialProviderViewController: ASCredentialProviderViewController {
  override func prepareCredentialList(for serviceIdentifiers: [ASCredentialServiceIdentifier]) {
    // TODO: load candidates from App Group after biometric unlock.
    // For now, show a minimal UI that opens the main app.
    let label = UILabel()
    label.text = "Open My Password Vault to unlock, then try Autofill again."
    label.numberOfLines = 0
    label.textAlignment = .center
    label.translatesAutoresizingMaskIntoConstraints = false
    view.backgroundColor = .systemBackground
    view.addSubview(label)
    NSLayoutConstraint.activate([
      label.leadingAnchor.constraint(equalTo: view.layoutMarginsGuide.leadingAnchor),
      label.trailingAnchor.constraint(equalTo: view.layoutMarginsGuide.trailingAnchor),
      label.centerYAnchor.constraint(equalTo: view.centerYAnchor),
    ])
  }

  override func provideCredentialWithoutUserInteraction(
    for credentialIdentity: ASPasswordCredentialIdentity
  ) {
    // No silent fill until the shared vault key is available.
    self.extensionContext.cancelRequest(
      withError: NSError(
        domain: ASExtensionErrorDomain,
        code: ASExtensionError.userInteractionRequired.rawValue
      )
    )
  }

  override func prepareInterfaceToProvideCredential(
    for credentialIdentity: ASPasswordCredentialIdentity
  ) {
    prepareCredentialList(for: [credentialIdentity.serviceIdentifier])
  }
}
