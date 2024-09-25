const { Client, GatewayIntentBits, PermissionsBitField } = require('discord.js');
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages // إضافة الصلاحية لاستقبال الرسائل الخاصة
    ]
});

// قائمة الكلمات البذيئة
const badWords = [
    "الكلمه الممنوعا", "الكلمه الممنوعه", "الكلمه الممنوعه", 
    "متنالكلمه الممنوعهاك", "الكلمه الممنوعه", "الكلمه الممنوعه", 
    "الكلمه الممنوعه", "قحالكلمه الممنوعهبه", "الكلمه الممنوعه", "الكلمه الممنوعه", "الكلمه الممنوعه", "الكلمه الممنوعه"
    // يمكنك إضافة المزيد من الكلمات هنا
];

// تحديد الشاتات
const mentionChannelID = ''; // ضع ID الشات الذي يتم فيه إرسال @everyone
const punishmentChannelID = ''; // ضع ID الشات الذي يتم فيه تنفيذ العقوبات

client.on('messageCreate', async message => {
    // التأكد من أن الرسالة ليست من البوت نفسه أو رسالة في DM
    if (message.author.bot || !message.guild) return;

    // فحص إذا كانت الرسالة تحتوي على كلمات بذيئة
    if (badWords.some(word => message.content.toLowerCase().includes(word))) {
        // محاولة الحصول على العضو من الكاش أو الجلب
        let member = await message.guild.members.fetch(message.author.id).catch(err => null);

        if (!member) {
            return message.channel.send("لم أستطع العثور على العضو.");
        }

        // التحقق من الصلاحيات
        if (member.roles.highest.position >= message.guild.members.me.roles.highest.position) {
            return message.channel.send("لا أستطيع إعطاء ميوت لهذا الشخص بسبب صلاحياته.");
        }

        try {
            // البحث عن الشاتات
            const mentionChannel = message.guild.channels.cache.get(mentionChannelID);
            const punishmentChannel = message.guild.channels.cache.get(punishmentChannelID);

            if (!mentionChannel || !punishmentChannel) {
                return message.channel.send("حدث خطأ في العثور على الشاتات المحددة.");
            }

            // إعطاء ميوت
            let muteRole = message.guild.roles.cache.find(role => role.name === "Muted");
            if (!muteRole) {
                muteRole = await message.guild.roles.create({
                    name: "Muted",
                    permissions: []
                });

                message.guild.channels.cache.forEach(channel => {
                    channel.permissionOverwrites.create(muteRole, {
                        SendMessages: false,
                        Speak: false
                    });
                });
            }
            await member.roles.add(muteRole);

            // تغيير الاسم قبل لي التعديل
            const originalNickname = member.nickname || member.user.username; // حفظ الاسم الأصلي
            await member.setNickname("أنا بنت مزه");

            //  إرسال رسالة في الشات المحدد مع قبل لي التعديل@everyone ومنشن الشخص 
            await mentionChannel.send(`@everyone شوفو البت المزه ده: ${member} 😎`);

            // إرسال رسالة في شات العقوبات قبل لي التعديل
            await punishmentChannel.send(`${member} تم إعطاؤه ميوت وتغيير اسمه بسبب استخدام كلمات غير لائقة.`);

            // الرساله ال بيكتبه علشان يشيل الموت قبل لي التعديل
            const dmMessage = `لقد تم إعطاؤك ميوت. لإعادة اسمك إلى \`${originalNickname}\` وإزالة الميوت، اكتب:\n\`\`\`\nصلي على النبي اللَّهُمَّ ‌صَلِّ ‌عَلَى ‌مُحَمَّدٍ ‌عَبْدِكَ ‌وَرَسُولِكَ، كَمَا صَلَّيْتَ عَلَى ‌إِبْرَاهِيمَ، وَبَارِكْ عَلَى مُحَمَّدٍ، وَعَلَى آلِ مُحَمَّدٍ، كَمَا باركت على إبراهيم وآل إبراهيم\n\`\`\`\n5 مرات.`;
            
            await member.send(dmMessage);

            // إضافة مستمع للرسائل الخاصة
            const filter = msg => msg.author.id === member.id; // فلتر للرسائل من العضو فقط

            // استخدام createMessageCollector لجمع الرسائل في خاص
            const collector = member.dmChannel.createMessageCollector({ filter, time: 60000 }); // جمع الرسائل لمدة 60 ثانية

            let count = 0;

            collector.on('collect', async msg => {
                if (msg.content.includes("صلي على النبي اللَّهُمَّ ‌صَلِّ ‌عَلَى ‌مُحَمَّدٍ ‌عَبْدِكَ ‌وَرَسُولِكَ، كَمَا صَلَّيْتَ عَلَى ‌إِبْرَاهِيمَ، وَبَارِكْ عَلَى مُحَمَّدٍ، وَعَلَى آلِ مُحَمَّدٍ، كَمَا باركت على إبراهيم وآل إبراهيم")) {
                    count++;
                    // تحقق من عدد المرات
                    if (count >= 5) {
                        // إزالة الميوت وإعادة الاسم
                        await member.roles.remove(muteRole);
                        await member.setNickname(originalNickname);

                        await member.send(`تمت إزالة الميوت وتم إعادة اسمك إلى \`${originalNickname}\`.`);
                        collector.stop(); // إيقاف جمع الرسائل
                    }
                }
            });

            collector.on('end', collected => {
                if (count < 5) {
                    member.send("لم يتم كتابة 'صلي على النبي' 5 مرات. تم إلغاء العملية.");
                }
            });

        } catch (error) {
            console.error(error);
            message.channel.send("حدث خطأ أثناء محاولة إعطاء الميوت أو تغيير الاسم.");
        }
    }
});

client.login(''); // ضع التوكن الخاص بالبوت هنا
// ملك فكرت الكون By @nnpp0
