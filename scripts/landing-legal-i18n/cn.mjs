/** Simplified Chinese legal copy. */
export default {
  metaTitlePrivacy: "隐私政策 — My Password Vault",
  metaDescriptionPrivacy: "Skyface, LLC 的 My Password Vault 隐私政策。",
  metaTitleTerms: "使用条款 — My Password Vault",
  metaDescriptionTerms: "Skyface, LLC 的 My Password Vault 使用条款。",
  legalPrivacyEyebrow: "隐私政策",
  legalPrivacyTitle: "My Password Vault 隐私政策",
  legalPrivacyIntro_html:
    '适用于 <strong>Skyface, LLC</strong>（「我们」）发布的 <strong>My Password Vault</strong>（「产品」），包括其 Web 应用及相关客户端。',
  legalPrivacyBody_html: `<h2>摘要</h2>
        <p>My Password Vault 采用<strong>本地优先保险库</strong>设计：条目在离开您的设备之前即在本地加密。可选云同步仅存储与登录账户关联的<strong>密文</strong>——我们有意设计系统，使<strong>我们无法读取您解密后的密码</strong>。</p>
        <p>本政策说明信息类别、存储位置、合作伙伴依赖及责任范围，以便您了解我们承诺的内容，以及按设计或法律仍由您承担的部分。</p>
        <h2>1. 我们处理的数据及目的</h2>
        <ul>
          <li><strong>账户与登录：</strong>创建账户（邮箱密码及/或通过 Google 登录）时，我们处理用户 ID、邮箱、登录方式元数据等，用于身份验证与账户运营。</li>
          <li><strong>加密保险库数据：</strong>使用云同步时，我们存储加密保险库块及协调版本所需的元数据（如时间戳、条目数），不存储明文密码或 TOTP 密钥。</li>
          <li><strong>许可与购买记录：</strong>购买永久 PRO 升级时，我们存储许可状态、购买日期、Stripe Checkout 会话引用及金额，与账户邮箱关联。<strong>Stripe</strong> 处理卡支付；我们不接收或存储完整卡号。</li>
          <li><strong>事务性邮件：</strong>使用邮箱登录或密码重置时，邮件服务商向您提供的地址发送验证或重置链接等消息。</li>
          <li><strong>运营与支持：</strong>若您发邮件至 <a href="mailto:contact@skyface.com">contact@skyface.com</a>，我们处理邮件内容以回复并改进产品。</li>
          <li><strong>技术日志：</strong>托管、数据库及支付合作伙伴可能保留 IP、时间戳、错误日志等常见遥测数据。</li>
        </ul>
        <h2>2. 留在您设备上的数据及我们刻意不持有的内容</h2>
        <p>产品在本地从主密码派生加密密钥。<strong>我们不以明文收集、存储或接收您的主密码。</strong>我们也不接收可用于读取设备上保险库条目的解密密钥。</p>
        <p>受保护字段（含条目密码与 TOTP 密钥）在客户端使用 PBKDF2-SHA-256 派生及 <strong>AES-GCM-256</strong> 等在您的硬件上加密。同步时<strong>服务器仅镜像密文</strong>；没有您的密钥，服务器无法有意义地解密保险库。</p>
        <h2>3. 第三方服务</h2>
        <ul>
          <li><strong>认证与数据库（Supabase）：</strong>账户登录及加密保险库记录、许可元数据存储。</li>
          <li><strong>Google：</strong>若选择 Google 登录，该认证流程适用 Google 隐私条款。</li>
          <li><strong>支付（Stripe）：</strong>一次性 PRO 购买的结账与支付处理；Stripe 隐私政策适用于其处理的支付数据。</li>
          <li><strong>邮件（Resend）：</strong>发送登录、密码重置等事务性邮件。</li>
          <li><strong>基础设施/托管/CDN：</strong>产品可能通过 Vercel 等托管与边缘网络交付。</li>
        </ul>
        <p>上述供应商作为处理者或子处理者处理有限数据以运营产品；其条款亦适用。</p>
        <h2>4. 分析、广告与出售数据</h2>
        <p>我们<strong>不出售个人信息</strong>，且<strong>不在</strong>保险库体验中投放第三方广告。我们亦不会故意买卖凭证列表——您的密码属于您。</p>
        <h2>5. 备份与导出</h2>
        <p>您在本地创建的可选备份（离线 JSON 导出）由您控制。若将其附加至邮件或云盘，风险由您选择；我们无法保护您自愿复制到别处的副本。</p>
        <h2>6. 保留与账户删除</h2>
        <p>账户活跃期间，我们保留账户、密文及许可记录，除非法律要求有限保留（如反欺诈）。支付合作伙伴可能按自身政策保留账单记录。</p>
        <p>您可在产品内 <strong>设置 → 账户 → 删除账户</strong> 永久删除账户，这将移除加密云备份、我们系统中的许可记录及登录账户。在您确认删除的设备上，本地保险库数据亦会在该流程中清除。若无法完成应用内删除，请联系 <a href="mailto:contact@skyface.com">contact@skyface.com</a>，我们将在合理范围内协助。</p>
        <h2>7. 您的隐私权利</h2>
        <p>根据所在地区，您可能享有访问、更正、删除或限制处理等权利。因我们无法解密您的保险库，仅能协助处理我们实际持有的账户级数据（如邮箱、许可状态、加密块）。请向 <a href="mailto:contact@skyface.com">contact@skyface.com</a> 提交请求；我们可能需要验证身份。</p>
        <h2>8. 儿童隐私</h2>
        <p>产品<strong>不面向 13 岁以下儿童</strong>（或当地适用的更低年龄门槛）。我们不会有意收集儿童个人信息。</p>
        <h2>9. 安全与您的责任</h2>
        <p>安全分层：浏览器密码学、HTTPS 传输 TLS、数据库访问控制。<strong>没有系统是完美的。</strong></p>
        <p>您的责任包括选择强主密码、保护设备、妥善保管导出文件、丢失后验证认证器、防范钓鱼等。<strong>错误配置、恶意软件、钓鱼、密码复用、丢失认证器/备份</strong>或<strong>使用 HTTP 站点</strong>可能破坏良好设计——数据离开我们默认保护后，这些风险超出我们控制。</p>
        <h2>10. Skyface 的保证与免责（摘要）</h2>
        <p><strong>我们承诺诚实与行业标准防护</strong>，包括围绕客户端加密与最小服务器知悉进行设计。</p>
        <ul>
          <li>我们<strong>不保证</strong>不间断或无错误可用性，亦不保证免疫浏览器、操作系统、密码库、供应商或误用导致的未公开漏洞。</li>
          <li><strong>在法律允许的最大范围内，</strong>我们免责间接、附带、特殊、后果性或惩罚性损害，以及凭证/导出文件在您的设备上被攻破后的未经授权访问所致损失。</li>
          <li><strong>司法例外：</strong>部分地区不允许某些免责；禁止处仅于允许范围内适用。</li>
        </ul>
        <p>另见<a href="./terms.html">使用条款</a>中的额外保证与责任限制。</p>
        <h2>11. 国际用户</h2>
        <p>服务器与处理者可能位于美国或其他司法管辖区。使用云功能即表示您承认在处理器提供的标准合同保障下，为运营产品可能进行跨境传输。</p>
        <h2>12. 变更</h2>
        <p>我们可能实质性更新本隐私政策，并在此发布修订后的「最后更新」日期。变更后继续使用产品，在法律允许范围内视为接受修订政策。</p>
        <h2>13. 联系</h2>
        <p>隐私或权利行使相关问题：<br />邮箱 <a href="mailto:contact@skyface.com">contact@skyface.com</a><br />网站 <a href="https://skyface.com/">https://skyface.com/</a></p>`,
  legalPrivacyUpdated: "<em>最后更新：2026 年 6 月 1 日</em>",
  legalTermsEyebrow: "法律",
  legalTermsTitle: "使用条款",
  legalTermsIntro_html:
    '本使用条款（「条款」）规范您对 <strong>My Password Vault</strong>（「产品」）的访问，包括本网站、Web 应用、云同步及购买，以及您与 <strong>Skyface, LLC</strong>（「我们」）的关系。应用商店等分发渠道可能另有附加条款。',
  legalTermsBody_html: `<h2>1. 同意与隐私</h2>
          <p>创建账户、登录或使用产品，即表示您同意本条款及说明信息处理方式的<a href="./privacy.html">隐私政策</a>。若不同意，请勿使用产品。</p>
          <h2>2. 非专业建议</h2>
          <p>产品相关材料以一般性术语描述安全概念，<strong>不构成法律、财务或合规建议</strong>。<strong>您</strong>须对如何使用产品（包括保护主密码、通行密钥与恢复材料）及判断产品是否满足您个人或组织的需要与适用的监管要求负责。<strong>我们</strong>（Skyface, LLC）甄选、签约并负责运营产品所使用的第三方基础设施（含身份验证、云同步、支付与托管），但受本条款所载限制约束。</p>
          <h2>3. 资格与账户</h2>
          <p>您须至少<strong>满 13 岁</strong>（或当地要求的最低年龄）方可使用产品。您须对账户下活动、登录凭证保密及维护强主密码负责。若怀疑未经授权访问，请立即联系 <a href="mailto:contact@skyface.com">contact@skyface.com</a>。</p>
          <h2>4. 方案、支付与退款</h2>
          <p>免费方案含有限密码条目数。<strong>一次性</strong>付费升级可在该账户解锁无限条目；价格于产品中显示（除非定价页变更，目前为 <strong>4.99 美元</strong>）。支付由 <strong>Stripe</strong> 处理；我们不存储完整卡号。购买一般为<strong>非订阅</strong>且为最终决定，除法律要求或我们酌情批准退款外。退款请求可发至 <a href="mailto:contact@skyface.com">contact@skyface.com</a>。</p>
          <h2>5. 可接受使用</h2>
          <p>您同意仅将产品用于合法的个人或内部业务密码管理。不得滥用产品或基础设施——包括试图未经授权访问、干扰其他用户、抓取、为绕过安全而逆向工程服务，或利用产品违法。我们可在合理必要时暂停或终止访问。</p>
          <h2>6. 您的数据与安全责任</h2>
          <p>产品设计为<strong>本地优先加密保险库</strong>。无主密码我们无法恢复或解密条目。您须负责设备安全、所创建备份及存储在产品外的导出。加密与云同步详见<a href="./privacy.html">隐私政策</a>。</p>
          <h2>7. 账户删除</h2>
          <p>您可在 <strong>设置 → 账户 → 删除账户</strong> 永久删除账户，按隐私政策移除云备份、许可记录及登录账户。在您确认删除的设备上，本地数据亦在该流程中清除。</p>
          <h2>8. 服务可用性与变更</h2>
          <p>我们可随时变更、暂停或停止产品或本网站的部分功能。不保证不间断可用或无错误运行。功能、条目限制及价格可能变更；重大价格变更将在可行时发布于定价页。</p>
          <h2>9. 知识产权</h2>
          <p>产品及本网站的品牌、文字与视觉资产，除另有说明外归 Skyface, LLC 或其许可方所有。未经许可不得为商业目的复制或再分发。保险库内容仍归您所有。</p>
          <h2>10. 免责声明</h2>
          <p>网站与产品按<strong>「现状」</strong>在法律允许的最大范围内提供。我们在允许范围内否认适销性、特定用途适用性及不侵权的默示保证。</p>
          <h2>11. 责任限制</h2>
          <p>在法律允许的最大范围内，Skyface, LLC 不对间接、附带、特殊、后果性或惩罚性损害，或因使用网站或产品导致的利润、数据或商誉损失负责，包括因丢失主密码或设备备份而无法访问保险库。</p>
          <h2>12. 条款变更</h2>
          <p>我们可能不时更新本条款；更新时本页底部「最后更新」日期将变更。变更后继续使用产品，在法律允许范围内视为接受修订条款。</p>
          <h2>13. 联系</h2>
          <p>有关本条款的问题：<br />邮箱 <a href="mailto:contact@skyface.com">contact@skyface.com</a><br />网站 <a href="https://skyface.com/">https://skyface.com/</a></p>`,
  legalTermsUpdated: "<em>最后更新：2026 年 6 月 1 日</em>",
};
