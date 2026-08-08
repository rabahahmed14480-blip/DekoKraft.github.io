import type { Metadata } from "next";
import Link from "next/link";
import PublicPageShell from "../components/PublicPageShell";
import { DkGlassPanel } from "../components/ui";
import "./about.css";

export const metadata: Metadata = {
  title: "من نحن | DekoKraft",
  description: "تعرف على DekoKraft ورؤيتها وأحدث مشاريعها وميزاتها.",
};

const currentFeatures = [
  "صفحة شخصية للمشارك.",
  "EchoLogo لإنشاء الشعارات والهويات البصرية.",
  "EchoDeko لمعالجة صور المنتجات وتجهيزها للعرض.",
  "أدوات تقليدية وأخرى مدعومة بالذكاء الاصطناعي.",
  "استمارة ذكية لإدخال المنتجات.",
];

const futureProjects = [
  "مرافق ذكي يساعد المشارك في استخدام الأدوات.",
  "اقتراحات ذكية لتحسين المنتجات.",
  "مساعد لإدارة الصفحة الشخصية.",
  "مشروع لتعلم اللغات.",
  "مشروع للخدمات الذكية يساعد المشارك والزائر على تجسيد أفكاره.",
];

export default function AboutPage() {
  return (
    <PublicPageShell className="aboutPublicShell" showFooter>
      <main className="aboutPage" dir="rtl">
        <div className="aboutPageContent">
          <Link className="aboutBackLink" href="/">
            <span aria-hidden="true">→</span>
            الرجوع إلى الواجهة الرئيسية
          </Link>

          <header className="aboutHero">
            <span className="aboutHeroIcon" aria-hidden="true">🏛</span>
            <h1>مرحبًا بك في DekoKraft</h1>
            <p>منصة تجمع الإبداع، والحرفة، والذكاء الاصطناعي في مكان واحد.</p>
          </header>

          <div className="aboutCards">
            <DkGlassPanel as="section" strength="subtle" className="aboutCard">
              <h2>من نحن</h2>
              <p>
                جاءت فكرة DekoKraft من تجربة واقعية، بعدما واجه مؤسس المنصة صعوبة في عرض أعماله
                والتنقل بين عدة برامج لإنجاز تصميم واحد أو تجهيز صورة منتج للنشر.
              </p>
              <p>
                ومن هنا وُلدت فكرة إنشاء مساحة تجمع أهم الأدوات في مكان واحد، لمساعدة الهواة
                والحرفيين وأصحاب المشاريع الصغيرة، وبشكل خاص الأشخاص الذين قد يجدون صعوبة في
                استخدام البرامج المتعددة أو في عرض أعمالهم، ومن بينهم ذوو الاحتياجات الخاصة.
              </p>
              <p>
                هدفنا أن يتفرغ المشارك لتطوير موهبته أو حرفته، بينما تساعده المنصة في الجوانب
                التقنية والتنظيمية، مثل تحسين الصور، وتصميم الهوية البصرية، وتجهيز المنتجات
                للعرض، والاستفادة من تقنيات الذكاء الاصطناعي عند الحاجة.
              </p>
            </DkGlassPanel>

            <DkGlassPanel as="section" strength="subtle" className="aboutCard">
              <h2>المرحلة الحالية للمشروع</h2>
              <p>
                نجحنا في الوصول إلى المرحلة الأولى من DekoKraft، وهي توفير منصة مجانية التسجيل
                تتيح للمشاركين، وبشكل خاص الهواة والحرفيين وذوي الاحتياجات الخاصة، إنشاء صفحة
                شخصية لعرض أعمالهم ومنتجاتهم.
              </p>
              <p>وتوفر المنصة حاليًا:</p>
              <ul>{currentFeatures.map((feature) => <li key={feature}>{feature}</li>)}</ul>
            </DkGlassPanel>

            <DkGlassPanel as="section" strength="subtle" className="aboutCard">
              <span className="aboutCardEyebrow">آخر مشروع</span>
              <h2>صندوق فاخر لتغليف الشموع</h2>
              <p>
                آخر مشروع تم تصميمه هو صندوق مخصص لتغليف الشموع، مع إمكانية تخصيص الزخارف
                والألوان والشعار وفق طلب العميل، وتجهيز التصميم للطباعة أو للعرض الرقمي.
              </p>
            </DkGlassPanel>

            <DkGlassPanel as="section" strength="subtle" className="aboutCard">
              <h2>الإشعارات والتحديثات</h2>
              <p>
                يتم في هذا القسم عرض آخر التحديثات والإعلانات والميزات الجديدة التي تضاف إلى
                المنصة، حتى يبقى المشاركون على اطلاع دائم بتطور DekoKraft.
              </p>
            </DkGlassPanel>

            <DkGlassPanel as="section" strength="subtle" className="aboutCard">
              <h2>حالة خدمات الذكاء الاصطناعي</h2>
              <p>
                تتوفر الأدوات اليدوية داخل المنصة دون الحاجة إلى استخدام التوليد الذكي. أما بعض
                العمليات، مثل إنشاء الصور أو الخلفيات أو الشعارات بالذكاء الاصطناعي، فقد تتطلب
                استخدام خدمات مدفوعة وفق الأسعار الرسمية لمزود الخدمة. يجب أن يظهر ذلك للمستخدم
                بوضوح قبل تنفيذ العملية.
              </p>
            </DkGlassPanel>

            <DkGlassPanel as="section" strength="subtle" className="aboutCard">
              <span className="aboutCardEyebrow">آخر ميزة مضافة</span>
              <h2>استمارة المنتج الذكية</h2>
              <p>
                تساعد استمارة المنتج الذكية المشارك على توفير الوقت أثناء إدخال المنتجات. فعند
                إدخال صورة المنتج وبياناته لأول مرة، تتذكر المنصة هذا المنتج. وعند عرضه مرة أخرى،
                تقترح تعبئة الحقول تلقائيًا مع ترك المجال للمستخدم لتصحيح المعلومات.
              </p>
              <p>
                تحفظ الاستمارة هذه التصحيحات لتصبح أكثر دقة في المرات القادمة، كما تحفظ المنتجات
                المتكررة داخل المخزن، وتساعد على المحافظة على الشكل واللون الطبيعي للمنتج عند
                وضعه داخل خلفية افتراضية.
              </p>
              <small className="aboutDevelopmentNote">هذه الميزة ما زالت في طور التطوير.</small>
            </DkGlassPanel>

            <DkGlassPanel as="section" strength="subtle" className="aboutCard">
              <h2>رؤيتنا للمستقبل</h2>
              <p>نعمل على تطوير:</p>
              <ul>{futureProjects.map((project) => <li key={project}>{project}</li>)}</ul>
            </DkGlassPanel>

            <DkGlassPanel as="section" strength="subtle" className="aboutCard aboutMessageCard">
              <h2>رسالتنا</h2>
              <p>
                هدفنا أن ينشغل الحرفي بإبداعه، بينما تساعده DekoKraft في التصميم والتنظيم وإدارة
                المنتجات، لتكون التقنية وسيلة لخدمة الإنسان، لا بديلًا عنه.
              </p>
            </DkGlassPanel>
          </div>
        </div>
      </main>
    </PublicPageShell>
  );
}
